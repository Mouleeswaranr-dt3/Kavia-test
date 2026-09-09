"""Policy-aware domain services shared by HTTP routes and the durable worker."""

from __future__ import annotations

import csv
import hashlib
import io
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .core import settings
from .models import (
    AccountManagerAssignment,
    AnomalyAlert,
    AuditEvent,
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
    utcnow,
)
from .repositories import (
    AccessRepository,
    AlertRepository,
    AnalyticsRepository,
    AuditRepository,
    ExportRepository,
    JobRepository,
    UploadRepository,
)
from .telemetry import log_event


def safe_denial() -> HTTPException:
    """Return a denial that does not disclose inaccessible resource existence."""
    return HTTPException(
        status_code=404,
        detail={"code": "resource_unavailable", "message": "The requested resource is unavailable."},
    )


# PUBLIC_INTERFACE
def require_principal(db: Session, external_subject: str | None) -> UserAccount:
    """Resolve an authenticated external subject to an active local account."""
    if not external_subject:
        raise HTTPException(
            status_code=401,
            detail={"code": "authentication_required", "message": "Authentication is required."},
        )
    principal = AccessRepository(db).find_active_principal(external_subject)
    if principal is None:
        raise HTTPException(
            status_code=401,
            detail={"code": "authentication_required", "message": "Authentication is required."},
        )
    return principal


# PUBLIC_INTERFACE
def authorize_site(db: Session, principal: UserAccount, site_id: str) -> Site:
    """Return an authorized site or safely deny access without confirming its existence."""
    access = AccessRepository(db)
    site = access.find_active_site(site_id)
    if site is None:
        raise safe_denial()

    now = utcnow()
    if principal.role == UserRole.ACCOUNT_MANAGER.value:
        if access.has_customer_assignment(principal.id, site.customer_id, now):
            return site

    if not access.has_site_grant(principal.id, site_id, now):
        raise safe_denial()
    return site


def write_audit(
    db: Session,
    actor_id: str | None,
    action: str,
    resource_type: str,
    resource_id: str | None,
    outcome: str,
    correlation_id: str,
) -> None:
    """Append safe audit evidence without raw readings or sensitive configuration."""
    AuditRepository(db).record(
        actor_id, action, resource_type, resource_id, outcome, correlation_id
    )


# PUBLIC_INTERFACE
def create_upload(
    db: Session,
    principal: UserAccount,
    site_id: str,
    file_name: str,
    content: bytes,
    correlation_id: str,
) -> MeterUpload:
    """Create immutable authorized upload provenance and a durable ingestion job."""
    if principal.role != UserRole.OPERATIONS.value:
        raise safe_denial()
    authorize_site(db, principal, site_id)
    if not content:
        raise HTTPException(
            status_code=422,
            detail={"code": "invalid_upload", "message": "The uploaded CSV file is empty."},
        )

    upload = MeterUpload(
        site_id=site_id,
        uploader_id=principal.id,
        checksum=hashlib.sha256(content).hexdigest(),
        source_file_name=file_name or "meter-readings.csv",
        source_payload=content.decode("utf-8", errors="replace"),
        status=LifecycleStatus.QUEUED.value,
    )
    UploadRepository(db).add(upload)
    JobRepository(db).add(
        ProcessingJob(
            job_type="ingestion",
            resource_type="meter_upload",
            resource_id=upload.id,
            idempotency_key=f"ingestion:{upload.checksum}:{site_id}",
            correlation_id=correlation_id,
        )
    )
    write_audit(db, principal.id, "meter_upload_created", "meter_upload", upload.id, "allowed", correlation_id)
    db.commit()
    db.refresh(upload)
    log_event(
        "meter_upload_queued",
        correlation_id=correlation_id,
        resource_type="meter_upload",
        resource_id=upload.id,
        outcome="queued",
    )
    return upload


def parse_csv(payload: str) -> tuple[list[tuple[datetime, Decimal]], dict]:
    """Validate the approved minimal CSV shape and return normalized accepted rows."""
    reader = csv.DictReader(io.StringIO(payload))
    if not reader.fieldnames or not {"timestamp", "kwh"}.issubset(set(reader.fieldnames)):
        return [], {"state": "rejected", "code": "required_headers_missing"}

    rows: list[tuple[datetime, Decimal]] = []
    for row_number, row in enumerate(reader, start=2):
        try:
            timestamp = datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00"))
            if timestamp.tzinfo is None:
                return [], {"state": "rejected", "code": "timestamp_timezone_required", "row": row_number}
            kwh = Decimal(row["kwh"])
            if kwh < 0:
                return [], {"state": "rejected", "code": "negative_kwh", "row": row_number}
            rows.append((timestamp.astimezone(timezone.utc), kwh))
        except (KeyError, ValueError, InvalidOperation):
            return [], {"state": "rejected", "code": "invalid_meter_row", "row": row_number}
    if not rows:
        return [], {"state": "rejected", "code": "no_meter_rows"}
    return rows, {"state": "accepted", "accepted_rows": len(rows)}


# PUBLIC_INTERFACE
def process_upload(db: Session, upload_id: str) -> None:
    """Process one queued upload into accepted readings and persisted daily analytics."""
    upload = db.get(MeterUpload, upload_id)
    if upload is None or upload.status not in {LifecycleStatus.QUEUED.value, LifecycleStatus.PROCESSING.value}:
        return

    upload.status = LifecycleStatus.PROCESSING.value
    rows, summary = parse_csv(upload.source_payload)
    if not rows:
        upload.status = LifecycleStatus.REJECTED.value
        upload.validation_summary = summary
        db.commit()
        return

    for observed_at, kwh in rows:
        db.add(MeterReading(upload_id=upload.id, site_id=upload.site_id, observed_at=observed_at, kwh_value=kwh))
    upload.validation_summary = summary
    upload.status = LifecycleStatus.COMPLETED.value
    db.flush()
    recalculate_analytics(db, upload.site_id)
    db.commit()


# PUBLIC_INTERFACE
def recalculate_analytics(db: Session, site_id: str) -> None:
    """Persist versioned daily facts using the 28 preceding-day, strict-threshold rule."""
    repository = AnalyticsRepository(db)
    totals = repository.reading_totals_by_day(site_id)
    by_day = {date.fromisoformat(str(day)): Decimal(str(total)) for day, total in totals}

    for current_day, total in by_day.items():
        daily = repository.find_daily_consumption(
            site_id, current_day, settings.calculation_version
        )
        if daily is None:
            daily = DailyConsumption(
                site_id=site_id,
                consumption_date=current_day,
                total_kwh=total,
                calculation_version=settings.calculation_version,
            )
            db.add(daily)
            db.flush()
        else:
            daily.total_kwh = total

        history = [
            by_day[day]
            for day in (current_day - timedelta(days=offset) for offset in range(1, 29))
            if day in by_day
        ]
        baseline = sum(history, Decimal("0")) / len(history) if len(history) == 28 else None
        deviation = ((total - baseline) / baseline * Decimal("100")) if baseline and baseline > 0 else None
        anomalous = bool(deviation is not None and deviation > settings.anomaly_threshold_percent)

        analytic = repository.find_analytic(daily.id)
        if analytic is None:
            analytic = DailyAnalytic(
                daily_consumption_id=daily.id,
                baseline_kwh=baseline,
                threshold_percent=settings.anomaly_threshold_percent,
                deviation_percent=deviation,
                anomaly_flag=anomalous,
                calculation_version=settings.calculation_version,
                policy_version="baseline-minimum-28-days",
            )
            db.add(analytic)
        else:
            analytic.baseline_kwh = baseline
            analytic.deviation_percent = deviation
            analytic.anomaly_flag = anomalous


# PUBLIC_INTERFACE
def consumption_rows(db: Session, site_id: str, from_date: date, to_date: date) -> list[DailyConsumption]:
    """Read derived daily consumption facts for an already-authorized site and date range."""
    return AnalyticsRepository(db).consumption_rows(
        site_id, from_date, to_date, settings.calculation_version
    )


# PUBLIC_INTERFACE
def upload_status(
    db: Session, principal: UserAccount, upload_id: str
) -> MeterUpload | None:
    """Return an authorized upload record without exposing persistence queries to routes."""
    upload = UploadRepository(db).get(upload_id)
    if upload is not None:
        authorize_site(db, principal, upload.site_id)
    return upload


# PUBLIC_INTERFACE
def daily_analytics_rows(
    db: Session, principal: UserAccount, site_id: str, from_date: date, to_date: date
) -> list[tuple[DailyConsumption, DailyAnalytic]]:
    """Return authorized analytic facts for a site and inclusive date range."""
    authorize_site(db, principal, site_id)
    return AnalyticsRepository(db).analytic_rows(site_id, from_date, to_date)


# PUBLIC_INTERFACE
def manager_alert_rows(
    db: Session, principal: UserAccount
) -> list[tuple[AnomalyAlert, DailyConsumption, DailyAnalytic]]:
    """Return alert records constrained to the manager's active portfolio."""
    return AlertRepository(db).list_for_manager(
        principal.id, manager_customer_ids(db, principal)
    )


# PUBLIC_INTERFACE
def manager_ranking_rows(
    db: Session, principal: UserAccount, from_date: date, to_date: date
) -> list[tuple[str, int]]:
    """Return ranking source rows limited to the manager's active portfolio."""
    return AnalyticsRepository(db).ranking_rows(
        manager_customer_ids(db, principal), from_date, to_date
    )


# PUBLIC_INTERFACE
def create_export(
    db: Session,
    principal: UserAccount,
    site_id: str,
    from_date: date,
    to_date: date,
    output_format: str,
    correlation_id: str,
) -> ExportRequest:
    """Authorize and persist an export request with its durable processing job."""
    authorize_site(db, principal, site_id)
    export = ExportRepository(db).add(
        ExportRequest(
            requester_id=principal.id,
            site_id=site_id,
            from_date=from_date,
            to_date=to_date,
            output_format=output_format,
        )
    )
    JobRepository(db).add(
        ProcessingJob(
            job_type="export",
            resource_type="export_request",
            resource_id=export.id,
            idempotency_key=f"export:{export.id}",
            correlation_id=correlation_id,
        )
    )
    write_audit(db, principal.id, "export_created", "export_request", export.id, "allowed", correlation_id)
    db.commit()
    db.refresh(export)
    log_event(
        "export_queued",
        correlation_id=correlation_id,
        resource_type="export_request",
        resource_id=export.id,
        outcome="queued",
    )
    return export


# PUBLIC_INTERFACE
def export_status(
    db: Session, principal: UserAccount, export_id: str
) -> ExportRequest | None:
    """Return an export only after authorization against its target site."""
    export = ExportRepository(db).get(export_id)
    if export is not None:
        authorize_site(db, principal, export.site_id)
    return export


# PUBLIC_INTERFACE
def manager_customer_ids(db: Session, principal: UserAccount) -> set[str]:
    """Return only the principal's current assigned customer portfolio."""
    if principal.role != UserRole.ACCOUNT_MANAGER.value:
        raise safe_denial()
    return AccessRepository(db).manager_customer_ids(principal.id, utcnow())
