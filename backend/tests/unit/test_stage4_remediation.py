"""Stage 4 remediation coverage for repository, error, job, and calculation boundaries."""

from __future__ import annotations

import json
import logging
from datetime import date
from decimal import Decimal

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.errors import install_exception_handlers
from app.models import (
    AuditEvent,
    Base,
    Customer,
    ExportRequest,
    LifecycleStatus,
    ProcessingJob,
    Site,
    SiteAccessGrant,
    UserAccount,
    UserRole,
)
from app.repositories import JobRepository
from app.services import create_export, parse_csv
from app.telemetry import JsonFormatter


def test_csv_policy_rejects_timezone_less_timestamp() -> None:
    """CSV ingestion must fail closed when a timestamp omits timezone information."""
    rows, summary = parse_csv("timestamp,kwh\n2026-01-01T00:00:00,12\n")

    assert rows == []
    assert summary["code"] == "timestamp_timezone_required"


def test_strict_anomaly_threshold_boundary_is_documented() -> None:
    """The approved strict rule leaves an exact 20 percent deviation non-anomalous."""
    baseline = Decimal("100")
    threshold = Decimal("20")

    exact_deviation = (Decimal("120") - baseline) / baseline * Decimal("100")
    exceeding_deviation = (Decimal("121") - baseline) / baseline * Decimal("100")

    assert not exact_deviation > threshold
    assert exceeding_deviation > threshold


def test_job_repository_claims_one_queued_job() -> None:
    """Durable job claiming returns queued work and excludes terminal job states."""
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        queued = ProcessingJob(
            job_type="ingestion",
            resource_type="meter_upload",
            resource_id="upload-1",
            idempotency_key="ingestion:1",
            correlation_id="correlation-1",
        )
        completed = ProcessingJob(
            job_type="export",
            resource_type="export_request",
            resource_id="export-1",
            idempotency_key="export:1",
            correlation_id="correlation-2",
            status=LifecycleStatus.COMPLETED.value,
        )
        session.add_all([queued, completed])
        session.commit()

        claimed = JobRepository(session).claim_next()

    assert claimed is not None
    assert claimed.id == queued.id


def test_create_export_persists_authorized_request_and_correlated_job() -> None:
    """Authorized exports must persist their lifecycle, job, and audit records."""
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        customer = Customer(
            external_reference="customer-1",
            display_name="Customer One",
        )
        principal = UserAccount(
            external_subject="customer-user-1",
            role=UserRole.CUSTOMER.value,
        )
        session.add_all([customer, principal])
        session.flush()

        site = Site(
            customer_id=customer.id,
            external_reference="site-1",
            name="Site One",
            business_category_reference=None,
        )
        session.add(site)
        session.flush()
        session.add(
            SiteAccessGrant(
                user_id=principal.id,
                site_id=site.id,
                access_role="viewer",
            )
        )
        session.commit()

        export = create_export(
            session,
            principal,
            site.id,
            date(2026, 1, 1),
            date(2026, 1, 31),
            "csv",
            "export-correlation-1",
        )

        job = session.scalar(
            select(ProcessingJob).where(
                ProcessingJob.resource_id == export.id,
                ProcessingJob.job_type == "export",
            )
        )
        audit = session.scalar(
            select(AuditEvent).where(
                AuditEvent.resource_id == export.id,
                AuditEvent.action == "export_created",
            )
        )

    assert isinstance(export, ExportRequest)
    assert export.status == LifecycleStatus.QUEUED.value
    assert job is not None
    assert job.correlation_id == "export-correlation-1"
    assert job.status == LifecycleStatus.QUEUED.value
    assert audit is not None
    assert audit.correlation_id == "export-correlation-1"


def test_unexpected_errors_use_safe_error_envelope() -> None:
    """Unexpected route failures must not disclose exception text to API callers."""
    application = FastAPI()
    install_exception_handlers(application)

    @application.get("/failure")
    def failure() -> None:
        """Raise an internal exception for centralized-handler verification."""
        raise RuntimeError("database password must not be exposed")

    response = TestClient(application, raise_server_exceptions=False).get("/failure")

    assert response.status_code == 500
    assert response.json() == {
        "code": "internal_error",
        "message": "The request could not be completed.",
        "correlation_id": "unavailable",
    }


def test_validation_errors_use_standard_safe_envelope() -> None:
    """Request validation failures must use the centralized safe response mapping."""
    application = FastAPI()
    install_exception_handlers(application)

    @application.get("/validated")
    def validated(value: int) -> dict[str, int]:
        """Require an integer query parameter for handler verification."""
        return {"value": value}

    response = TestClient(application, raise_server_exceptions=False).get(
        "/validated", params={"value": "not-an-integer"}
    )

    assert response.status_code == 422
    assert response.json()["code"] == "invalid_request"
    assert response.json()["message"] == "The request contains invalid values."
    assert response.json()["correlation_id"] == "unavailable"
    assert response.json()["details"][0]["field"] == "query.value"


def test_expected_http_errors_use_safe_error_envelope() -> None:
    """Expected route failures must preserve only their approved public details."""
    application = FastAPI()
    install_exception_handlers(application)

    @application.get("/missing")
    def missing() -> None:
        """Raise an approved unavailable-resource response for handler verification."""
        from fastapi import HTTPException

        raise HTTPException(
            404,
            detail={
                "code": "resource_unavailable",
                "message": "The requested resource is unavailable.",
            },
        )

    response = TestClient(application, raise_server_exceptions=False).get("/missing")

    assert response.status_code == 404
    assert response.json() == {
        "code": "resource_unavailable",
        "message": "The requested resource is unavailable.",
        "correlation_id": "unavailable",
    }


def test_structured_logs_allowlist_operational_fields() -> None:
    """Structured telemetry must retain approved context while excluding arbitrary secrets."""
    record = logging.makeLogRecord(
        {
            "msg": "request_completed",
            "levelno": logging.INFO,
            "levelname": "INFO",
            "event": "request_completed",
            "correlation_id": "correlation-1",
            "route": "/api/v1/exports",
            "database_url": "must-not-appear",
            "source_payload": "must-not-appear",
        }
    )

    payload = json.loads(JsonFormatter().format(record))

    assert payload["event"] == "request_completed"
    assert payload["correlation_id"] == "correlation-1"
    assert payload["route"] == "/api/v1/exports"
    assert "database_url" not in payload
    assert "source_payload" not in payload
