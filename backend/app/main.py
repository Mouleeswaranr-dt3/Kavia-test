"""FastAPI entry point for the EnerSight Analytics modular backend."""

from __future__ import annotations

import csv
import io
import time
import uuid
from datetime import date
from decimal import Decimal

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session

from .core import get_correlation_id, get_db, require_enabled, settings
from .errors import install_exception_handlers
from .models import (
    LifecycleStatus,
)
from .schemas import (
    AlertsResponse,
    AlertResponse,
    BenchmarkResponse,
    ConsumptionQuery,
    ConsumptionResponse,
    CreateExportRequest,
    DailyAnalyticsResponse,
    DailyAnalyticValue,
    ExportResponse,
    PeriodValue,
    RankingCriterion,
    RankingResponse,
    RankingRow,
    UploadResponse,
)
from .services import (
    authorize_site,
    create_export,
    consumption_rows,
    create_upload,
    daily_analytics_rows,
    export_status,
    manager_alert_rows,
    manager_ranking_rows,
    require_principal,
    upload_status,
)
from .telemetry import log_event

app = FastAPI(
    title="EnerSight Analytics API",
    description=(
        "Authorized commercial energy analytics, durable ingestion, anomaly alerts, "
        "rankings, governed benchmark states, and protected export lifecycle APIs."
    ),
    version="1.0.0",
    openapi_tags=[
        {"name": "Meter uploads", "description": "Authorized CSV upload provenance and status."},
        {"name": "Sites", "description": "Authorized site consumption and analytics."},
        {"name": "Account manager", "description": "Assigned-portfolio alerts and rankings."},
        {"name": "Exports", "description": "Authorized export lifecycle and downloads."},
    ],
)
install_exception_handlers(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_trusted_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-External-Subject", "X-Correlation-ID"],
)

@app.middleware("http")
async def log_request_lifecycle(request: Request, call_next):
    """Establish correlation context and emit safe structured request lifecycle events."""
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
    request.state.correlation_id = correlation_id
    started_at = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        route = request.scope.get("route")
        log_event(
            "request_failed",
            correlation_id=correlation_id,
            method=request.method,
            route=route.path if route else request.url.path,
            duration_ms=round((time.perf_counter() - started_at) * 1000, 2),
            outcome="failed",
            failure_category="unhandled_request_failure",
        )
        raise

    route = request.scope.get("route")
    log_event(
        "request_completed",
        correlation_id=correlation_id,
        method=request.method,
        route=route.path if route else request.url.path,
        status_code=response.status_code,
        duration_ms=round((time.perf_counter() - started_at) * 1000, 2),
        outcome="completed" if response.status_code < 500 else "failed",
    )
    response.headers["X-Correlation-ID"] = correlation_id
    return response


def principal_dependency(
    db: Session = Depends(get_db),
    external_subject: str | None = Header(default=None, alias="X-External-Subject"),
):
    """Resolve the request's externally authenticated subject to its local principal."""
    return require_principal(db, external_subject)


# PUBLIC_INTERFACE
@app.post(
    f"{settings.api_v1_prefix}/meter-uploads",
    response_model=UploadResponse,
    tags=["Meter uploads"],
    summary="Create an authorized meter CSV upload",
)
async def post_meter_upload(
    site_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    principal=Depends(principal_dependency),
    correlation_id: str = Depends(get_correlation_id),
    _: None = Depends(require_enabled),
) -> UploadResponse:
    """Create immutable upload provenance and queue durable ingestion for one authorized site."""
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(422, detail={"code": "invalid_upload", "message": "Only CSV files are accepted."})
    upload = create_upload(db, principal, site_id, file.filename or "meter-readings.csv", await file.read(), correlation_id)
    return UploadResponse(id=upload.id, site_id=upload.site_id, status=upload.status, validation_summary=upload.validation_summary)


# PUBLIC_INTERFACE
@app.get(
    f"{settings.api_v1_prefix}/meter-uploads/{{upload_id}}",
    response_model=UploadResponse,
    tags=["Meter uploads"],
    summary="Read authorized upload status",
)
def get_meter_upload(
    upload_id: str,
    db: Session = Depends(get_db),
    principal=Depends(principal_dependency),
    _: None = Depends(require_enabled),
) -> UploadResponse:
    """Return safe provenance and processing status for an authorized upload."""
    upload = upload_status(db, principal, upload_id)
    if upload is None:
        raise HTTPException(404, detail={"code": "resource_unavailable", "message": "The requested resource is unavailable."})
    return UploadResponse(id=upload.id, site_id=upload.site_id, status=upload.status, validation_summary=upload.validation_summary)


# PUBLIC_INTERFACE
@app.get(
    f"{settings.api_v1_prefix}/sites/{{site_id}}/consumption",
    response_model=ConsumptionResponse,
    tags=["Sites"],
    summary="Read authorized aggregated consumption",
)
def get_consumption(
    site_id: str,
    query: ConsumptionQuery = Depends(),
    db: Session = Depends(get_db),
    principal=Depends(principal_dependency),
    _: None = Depends(require_enabled),
) -> ConsumptionResponse:
    """Return daily, weekly, or monthly derived consumption with an explicit no-data state."""
    authorize_site(db, principal, site_id)
    facts = consumption_rows(db, site_id, query.from_date, query.to_date)
    grouped: dict[tuple[date, date], Decimal] = {}
    for fact in facts:
        if query.granularity.value == "daily":
            start = end = fact.consumption_date
        elif query.granularity.value == "weekly":
            start = fact.consumption_date - __import__("datetime").timedelta(days=fact.consumption_date.weekday())
            end = start + __import__("datetime").timedelta(days=6)
        else:
            start = fact.consumption_date.replace(day=1)
            next_month = (start.replace(day=28) + __import__("datetime").timedelta(days=4)).replace(day=1)
            end = next_month - __import__("datetime").timedelta(days=1)
        grouped[(start, end)] = grouped.get((start, end), Decimal("0")) + fact.total_kwh
    return ConsumptionResponse(
        site_id=site_id,
        from_date=query.from_date,
        to_date=query.to_date,
        granularity=query.granularity,
        state="available" if grouped else "no_data",
        periods=[PeriodValue(period_start=start, period_end=end, total_kwh=total) for (start, end), total in grouped.items()],
    )


# PUBLIC_INTERFACE
@app.get(
    f"{settings.api_v1_prefix}/sites/{{site_id}}/daily-analytics",
    response_model=DailyAnalyticsResponse,
    tags=["Sites"],
    summary="Read authorized daily analytics",
)
def get_daily_analytics(
    site_id: str,
    from_date: date,
    to_date: date,
    db: Session = Depends(get_db),
    principal=Depends(principal_dependency),
    _: None = Depends(require_enabled),
) -> DailyAnalyticsResponse:
    """Return explainable daily analytics with per-day unavailable-baseline state."""
    if from_date > to_date:
        raise HTTPException(422, detail={"code": "invalid_request", "message": "to_date must be on or after from_date."})
    rows = daily_analytics_rows(db, principal, site_id, from_date, to_date)
    days = [
        DailyAnalyticValue(
            consumption_date=consumption.consumption_date,
            actual_kwh=consumption.total_kwh,
            baseline_kwh=analytic.baseline_kwh,
            deviation_percent=analytic.deviation_percent,
            threshold_percent=analytic.threshold_percent,
            anomaly_flag=analytic.anomaly_flag,
            state="available" if analytic.baseline_kwh else "baseline_unavailable",
        )
        for consumption, analytic in rows
    ]
    return DailyAnalyticsResponse(site_id=site_id, from_date=from_date, to_date=to_date, state="available" if days else "no_data", days=days)


# PUBLIC_INTERFACE
@app.get(
    f"{settings.api_v1_prefix}/sites/{{site_id}}/benchmark",
    response_model=BenchmarkResponse,
    tags=["Sites"],
    summary="Read a governed benchmark state",
)
def get_benchmark(
    site_id: str,
    db: Session = Depends(get_db),
    principal=Depends(principal_dependency),
    _: None = Depends(require_enabled),
) -> BenchmarkResponse:
    """Return explicit benchmark unavailability until peer governance integration is enabled."""
    authorize_site(db, principal, site_id)
    return BenchmarkResponse(site_id=site_id, state="unavailable", reason_code="peer_governance_not_configured")


# PUBLIC_INTERFACE
@app.get(
    f"{settings.api_v1_prefix}/account-manager/alerts",
    response_model=AlertsResponse,
    tags=["Account manager"],
    summary="List assigned-portfolio anomaly alerts",
)
def get_alerts(
    db: Session = Depends(get_db),
    principal=Depends(principal_dependency),
    _: None = Depends(require_enabled),
) -> AlertsResponse:
    """List only alerts belonging to customers in the current manager's authorized portfolio."""
    rows = manager_alert_rows(db, principal)
    return AlertsResponse(
        state="available" if rows else "no_data",
        alerts=[AlertResponse(id=alert.id, customer_id=alert.customer_id, site_id=alert.site_id, anomaly_date=consumption.consumption_date, deviation_percent=analytic.deviation_percent or Decimal("0"), status=alert.status) for alert, consumption, analytic in rows],
    )


# PUBLIC_INTERFACE
@app.get(
    f"{settings.api_v1_prefix}/account-manager/customer-ranking",
    response_model=RankingResponse,
    tags=["Account manager"],
    summary="Rank assigned customers by anomaly count",
)
def get_customer_ranking(
    from_date: date,
    to_date: date,
    criterion: RankingCriterion = RankingCriterion.ANOMALY_COUNT,
    db: Session = Depends(get_db),
    principal=Depends(principal_dependency),
    _: None = Depends(require_enabled),
) -> RankingResponse:
    """Return rankings restricted to the manager's active portfolio and selected period."""
    if from_date > to_date:
        raise HTTPException(422, detail={"code": "invalid_request", "message": "to_date must be on or after from_date."})
    results = manager_ranking_rows(db, principal, from_date, to_date)
    return RankingResponse(criterion=criterion, from_date=from_date, to_date=to_date, state="available" if results else "no_data", rows=[RankingRow(customer_id=customer_id, anomaly_count=count, rank=index) for index, (customer_id, count) in enumerate(results, start=1)])


# PUBLIC_INTERFACE
@app.post(
    f"{settings.api_v1_prefix}/exports",
    response_model=ExportResponse,
    tags=["Exports"],
    summary="Create an authorized durable export request",
)
def post_export(
    command: CreateExportRequest,
    db: Session = Depends(get_db),
    principal=Depends(principal_dependency),
    correlation_id: str = Depends(get_correlation_id),
    _: None = Depends(require_enabled),
) -> ExportResponse:
    """Authorize an export and queue generation without exposing a storage reference."""
    export = create_export(
        db, principal, command.site_id, command.from_date, command.to_date,
        command.output_format.value, correlation_id,
    )
    return ExportResponse(id=export.id, site_id=export.site_id, status=export.status, output_format=command.output_format, expires_at=None, download_available=False)


# PUBLIC_INTERFACE
@app.get(
    f"{settings.api_v1_prefix}/exports/{{export_id}}",
    response_model=ExportResponse,
    tags=["Exports"],
    summary="Read authorized export lifecycle status",
)
def get_export(
    export_id: str,
    db: Session = Depends(get_db),
    principal=Depends(principal_dependency),
    _: None = Depends(require_enabled),
) -> ExportResponse:
    """Return safe export lifecycle data for an authorized requester or authorized site viewer."""
    export = export_status(db, principal, export_id)
    if export is None:
        raise HTTPException(404, detail={"code": "resource_unavailable", "message": "The requested resource is unavailable."})
    return ExportResponse(id=export.id, site_id=export.site_id, status=export.status, output_format=export.output_format, expires_at=export.expires_at, failure_category=export.failure_category, download_available=export.status == LifecycleStatus.COMPLETED.value)


# PUBLIC_INTERFACE
@app.get(
    f"{settings.api_v1_prefix}/exports/{{export_id}}/download",
    tags=["Exports"],
    summary="Download a completed export after reauthorization",
)
def download_export(
    export_id: str,
    db: Session = Depends(get_db),
    principal=Depends(principal_dependency),
    _: None = Depends(require_enabled),
) -> Response:
    """Reauthorize and stream an in-memory CSV only for a completed approved export request."""
    export = export_status(db, principal, export_id)
    if export is None or export.status != LifecycleStatus.COMPLETED.value:
        raise HTTPException(404, detail={"code": "resource_unavailable", "message": "The requested resource is unavailable."})
    if export.output_format != "csv":
        raise HTTPException(409, detail={"code": "export_not_ready", "message": "This export format is not available for download."})
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["date", "total_kwh"])
    for row in consumption_rows(db, export.site_id, export.from_date, export.to_date):
        writer.writerow([row.consumption_date.isoformat(), row.total_kwh])
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="enersight-{export.id}.csv"'})
