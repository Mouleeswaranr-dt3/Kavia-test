"""Neon-backed Stage 4 integration verification for protected workflow boundaries.

This test is intentionally opt-in because it creates short-lived data in a shared
non-production Neon database. The verification runner must provide DATABASE_URL
securely and set RUN_NEON_INTEGRATION_TESTS=true for the child process only.
Neither this harness nor its assertions print connection details or feature flags.
"""

from __future__ import annotations

import os
import uuid
from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.core import SessionLocal
from app.main import app
from app.models import (
    AccountManagerAssignment,
    AnomalyAlert,
    AuditEvent,
    Customer,
    DailyAnalytic,
    DailyConsumption,
    ExportRequest,
    LifecycleStatus,
    MeterReading,
    MeterUpload,
    ProcessingJob,
    Site,
    SiteAccessGrant,
    UserAccount,
    UserRole,
)
from app.worker import run_once


pytestmark = pytest.mark.integration


@pytest.fixture(scope="module")
def neon_guard() -> None:
    """Require an explicit, non-production Neon verification runtime."""
    database_url = os.getenv("DATABASE_URL", "")
    if os.getenv("RUN_NEON_INTEGRATION_TESTS") != "true":
        pytest.skip("Neon integration verification was not explicitly enabled.")
    if not database_url.startswith(("postgresql://", "postgresql+psycopg://")):
        pytest.skip("A PostgreSQL verification database was not provided.")
    if "neon" not in database_url.lower():
        pytest.skip("The supplied verification database is not a Neon endpoint.")


@pytest.fixture
def isolated_neon_workflow(neon_guard: None) -> dict[str, str]:
    """Create and remove a complete, uniquely named verification data graph."""
    namespace = f"stage4-it-{uuid.uuid4().hex}"
    correlation_id = f"{namespace}-correlation"
    records: dict[str, str] = {"correlation_id": correlation_id}

    with SessionLocal() as db:
        # Do not let this verification worker claim or alter another workflow's job.
        existing_queued_job = db.scalar(
            select(ProcessingJob.id)
            .where(ProcessingJob.status == LifecycleStatus.QUEUED.value)
            .limit(1)
        )
        if existing_queued_job is not None:
            pytest.skip("Verification database has queued work owned by another workflow.")

        allowed_customer = Customer(
            external_reference=f"{namespace}-customer-allowed",
            display_name="Stage 4 Allowed Customer",
        )
        denied_customer = Customer(
            external_reference=f"{namespace}-customer-denied",
            display_name="Stage 4 Denied Customer",
        )
        operations_user = UserAccount(
            external_subject=f"{namespace}-operations",
            role=UserRole.OPERATIONS.value,
        )
        customer_user = UserAccount(
            external_subject=f"{namespace}-customer-user",
            role=UserRole.CUSTOMER.value,
        )
        denied_user = UserAccount(
            external_subject=f"{namespace}-denied-user",
            role=UserRole.CUSTOMER.value,
        )
        manager_user = UserAccount(
            external_subject=f"{namespace}-manager",
            role=UserRole.ACCOUNT_MANAGER.value,
        )
        db.add_all(
            [
                allowed_customer,
                denied_customer,
                operations_user,
                customer_user,
                denied_user,
                manager_user,
            ]
        )
        db.flush()

        allowed_site = Site(
            customer_id=allowed_customer.id,
            external_reference=f"{namespace}-site-allowed",
            name="Stage 4 Allowed Site",
            business_category_reference=None,
        )
        denied_site = Site(
            customer_id=denied_customer.id,
            external_reference=f"{namespace}-site-denied",
            name="Stage 4 Denied Site",
            business_category_reference=None,
        )
        db.add_all([allowed_site, denied_site])
        db.flush()

        db.add_all(
            [
                SiteAccessGrant(
                    user_id=operations_user.id,
                    site_id=allowed_site.id,
                    access_role="operator",
                ),
                SiteAccessGrant(
                    user_id=customer_user.id,
                    site_id=allowed_site.id,
                    access_role="viewer",
                ),
                AccountManagerAssignment(
                    user_id=manager_user.id,
                    customer_id=allowed_customer.id,
                ),
            ]
        )

        # Two alerts prove that manager views return only the assigned portfolio.
        for site, customer in (
            (allowed_site, allowed_customer),
            (denied_site, denied_customer),
        ):
            daily = DailyConsumption(
                site_id=site.id,
                consumption_date=date(2026, 1, 31),
                total_kwh=Decimal("125"),
                calculation_version="1",
            )
            db.add(daily)
            db.flush()
            analytic = DailyAnalytic(
                daily_consumption_id=daily.id,
                baseline_kwh=Decimal("100"),
                threshold_percent=Decimal("20"),
                deviation_percent=Decimal("25"),
                anomaly_flag=True,
                calculation_version="1",
                policy_version="integration-test",
            )
            db.add(analytic)
            db.flush()
            db.add(
                AnomalyAlert(
                    analytic_id=analytic.id,
                    customer_id=customer.id,
                    site_id=site.id,
                    assignee_id=manager_user.id,
                )
            )

        db.commit()
        records.update(
            {
                "allowed_customer_id": allowed_customer.id,
                "denied_customer_id": denied_customer.id,
                "allowed_site_id": allowed_site.id,
                "denied_site_id": denied_site.id,
                "operations_subject": operations_user.external_subject,
                "customer_subject": customer_user.external_subject,
                "denied_subject": denied_user.external_subject,
                "manager_subject": manager_user.external_subject,
                "operations_user_id": operations_user.id,
                "customer_user_id": customer_user.id,
                "denied_user_id": denied_user.id,
                "manager_user_id": manager_user.id,
            }
        )

    try:
        yield records
    finally:
        with SessionLocal() as db:
            resource_ids = [
                value
                for key, value in records.items()
                if key in {"upload_id", "export_id"}
            ]
            user_ids = [
                records[key]
                for key in (
                    "operations_user_id",
                    "customer_user_id",
                    "denied_user_id",
                    "manager_user_id",
                )
            ]
            site_ids = [records["allowed_site_id"], records["denied_site_id"]]
            customer_ids = [
                records["allowed_customer_id"],
                records["denied_customer_id"],
            ]

            # Delete only records created by this namespaced harness, in FK order.
            db.execute(
                delete(AuditEvent).where(
                    (AuditEvent.correlation_id == records["correlation_id"])
                    | (AuditEvent.actor_id.in_(user_ids))
                )
            )
            if resource_ids:
                db.execute(
                    delete(ProcessingJob).where(
                        (ProcessingJob.correlation_id == records["correlation_id"])
                        | (ProcessingJob.resource_id.in_(resource_ids))
                    )
                )
                db.execute(delete(ExportRequest).where(ExportRequest.id.in_(resource_ids)))
                db.execute(delete(MeterReading).where(MeterReading.upload_id.in_(resource_ids)))
                db.execute(delete(MeterUpload).where(MeterUpload.id.in_(resource_ids)))

            analytic_ids = db.scalars(
                select(DailyAnalytic.id)
                .join(
                    DailyConsumption,
                    DailyConsumption.id == DailyAnalytic.daily_consumption_id,
                )
                .where(DailyConsumption.site_id.in_(site_ids))
            ).all()
            if analytic_ids:
                db.execute(delete(AnomalyAlert).where(AnomalyAlert.analytic_id.in_(analytic_ids)))
                db.execute(delete(DailyAnalytic).where(DailyAnalytic.id.in_(analytic_ids)))
            db.execute(delete(DailyConsumption).where(DailyConsumption.site_id.in_(site_ids)))
            db.execute(delete(AccountManagerAssignment).where(AccountManagerAssignment.user_id.in_(user_ids)))
            db.execute(delete(SiteAccessGrant).where(SiteAccessGrant.user_id.in_(user_ids)))
            db.execute(delete(Site).where(Site.id.in_(site_ids)))
            db.execute(delete(UserAccount).where(UserAccount.id.in_(user_ids)))
            db.execute(delete(Customer).where(Customer.id.in_(customer_ids)))
            db.commit()


def test_neon_protected_routes_and_durable_workflows(
    isolated_neon_workflow: dict[str, str],
) -> None:
    """Verify Stage 4 authorization, lifecycle, audit, worker, and correlation rules."""
    records = isolated_neon_workflow
    correlation_header = {"X-Correlation-ID": records["correlation_id"]}
    operations_headers = {
        **correlation_header,
        "X-External-Subject": records["operations_subject"],
    }
    customer_headers = {
        **correlation_header,
        "X-External-Subject": records["customer_subject"],
    }
    denied_headers = {
        **correlation_header,
        "X-External-Subject": records["denied_subject"],
    }
    manager_headers = {
        **correlation_header,
        "X-External-Subject": records["manager_subject"],
    }

    with TestClient(app, raise_server_exceptions=False) as client:
        unauthenticated = client.get(
            f"/api/v1/sites/{records['allowed_site_id']}/benchmark",
            headers=correlation_header,
        )
        assert unauthenticated.status_code == 401
        assert unauthenticated.json()["code"] == "authentication_required"
        assert unauthenticated.headers["X-Correlation-ID"] == records["correlation_id"]

        cross_customer = client.get(
            f"/api/v1/sites/{records['denied_site_id']}/benchmark",
            headers=denied_headers,
        )
        assert cross_customer.status_code == 404
        assert cross_customer.json()["code"] == "resource_unavailable"

        manager_visible = client.get(
            f"/api/v1/sites/{records['allowed_site_id']}/benchmark",
            headers=manager_headers,
        )
        assert manager_visible.status_code == 200

        manager_hidden = client.get(
            f"/api/v1/sites/{records['denied_site_id']}/benchmark",
            headers=manager_headers,
        )
        assert manager_hidden.status_code == 404

        alerts = client.get("/api/v1/account-manager/alerts", headers=manager_headers)
        assert alerts.status_code == 200
        assert [alert["customer_id"] for alert in alerts.json()["alerts"]] == [
            records["allowed_customer_id"]
        ]

        ranking = client.get(
            "/api/v1/account-manager/customer-ranking",
            params={"from_date": "2026-01-01", "to_date": "2026-02-01"},
            headers=manager_headers,
        )
        assert ranking.status_code == 200
        assert [row["customer_id"] for row in ranking.json()["rows"]] == [
            records["allowed_customer_id"]
        ]

        upload = client.post(
            f"/api/v1/meter-uploads?site_id={records['allowed_site_id']}",
            files={
                "file": (
                    "readings.csv",
                    b"timestamp,kwh\n2026-01-31T00:00:00Z,125\n",
                    "text/csv",
                )
            },
            headers=operations_headers,
        )
        assert upload.status_code == 200
        records["upload_id"] = upload.json()["id"]
        assert upload.json()["status"] == LifecycleStatus.QUEUED.value

        assert run_once() is True
        completed_upload = client.get(
            f"/api/v1/meter-uploads/{records['upload_id']}",
            headers=operations_headers,
        )
        assert completed_upload.status_code == 200
        assert completed_upload.json()["status"] == LifecycleStatus.COMPLETED.value

        export = client.post(
            "/api/v1/exports",
            json={
                "site_id": records["allowed_site_id"],
                "from_date": "2026-01-01",
                "to_date": "2026-02-01",
                "output_format": "csv",
            },
            headers=customer_headers,
        )
        assert export.status_code == 200
        records["export_id"] = export.json()["id"]
        assert export.json()["status"] == LifecycleStatus.QUEUED.value

        assert run_once() is True
        completed_export = client.get(
            f"/api/v1/exports/{records['export_id']}",
            headers=customer_headers,
        )
        assert completed_export.status_code == 200
        assert completed_export.json()["status"] == LifecycleStatus.COMPLETED.value
        assert completed_export.json()["download_available"] is True

        reauthorization = client.get(
            f"/api/v1/exports/{records['export_id']}/download",
            headers=denied_headers,
        )
        assert reauthorization.status_code == 404
        assert reauthorization.json()["code"] == "resource_unavailable"

        download = client.get(
            f"/api/v1/exports/{records['export_id']}/download",
            headers=customer_headers,
        )
        assert download.status_code == 200
        assert download.headers["content-type"].startswith("text/csv")
        assert "date,total_kwh" in download.text

    with SessionLocal() as db:
        jobs = db.scalars(
            select(ProcessingJob).where(
                ProcessingJob.correlation_id == records["correlation_id"]
            )
        ).all()
        audit_actions = set(
            db.scalars(
                select(AuditEvent.action).where(
                    AuditEvent.correlation_id == records["correlation_id"]
                )
            )
        )

    assert {job.job_type for job in jobs} == {"ingestion", "export"}
    assert all(job.status == LifecycleStatus.COMPLETED.value for job in jobs)
    assert audit_actions == {"meter_upload_created", "export_created"}
