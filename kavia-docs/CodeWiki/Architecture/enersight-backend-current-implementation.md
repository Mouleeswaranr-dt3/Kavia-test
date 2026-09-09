[CodeWiki](../index.md) / [Architecture](index.md)

# EnerSight Backend: Current Implementation

## Scope and evidence

This document describes the backend implementation present in `backend/` as reviewed from its Python source, dependency manifest, operational README, and unit tests. It documents implemented behavior, not future-state requirements.

The application is a FastAPI service backed by SQLAlchemy. Its direct dependencies are FastAPI, Uvicorn, SQLAlchemy, Pydantic, PostgreSQL support through `psycopg`, multipart upload support, and pytest.

```text
backend/requirements.txt
fastapi==0.115.7
sqlalchemy==2.0.37
pydantic==2.10.6
psycopg[binary]==3.2.4
pytest==8.3.4
```

## Runtime structure

The HTTP application is declared in `backend/app/main.py`. It installs centralized exception handlers and CORS middleware, then exposes a versioned API under the environment-configured prefix, which defaults to `/api/v1`.

```python
# backend/app/main.py
app = FastAPI(title="EnerSight Analytics API", version="1.0.0")
install_exception_handlers(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_trusted_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-External-Subject", "X-Correlation-ID"],
)
```

Configuration is loaded when `app.core` is imported. `DATABASE_URL` is mandatory, the product feature flag defaults to disabled, and the default anomaly threshold is 20 percent.

```python
# backend/app/core.py
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL must be provided by the deployment environment.")

feature_enabled=_boolean(os.getenv("FEATURE_ENERSIGHT_ENABLED", "false"))
anomaly_threshold_percent=Decimal(os.getenv("ANOMALY_THRESHOLD_PERCENT", "20"))
```

Every product route depends on `require_enabled`, so an environment with the feature flag unset returns a `503 feature_disabled` response before performing the business operation.

## Request processing, identity, and authorization

HTTP requests receive a correlation identifier from `X-Correlation-ID` or a generated UUID. The middleware emits a lifecycle event and adds the identifier to the response headers.

```python
# backend/app/main.py
correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
request.state.correlation_id = correlation_id
...
response.headers["X-Correlation-ID"] = correlation_id
```

The current implementation treats `X-External-Subject` as the externally authenticated identity input. `require_principal` resolves that subject to an active local `UserAccount`; missing or unrecognized subjects receive `401 authentication_required`.

```python
# backend/app/services.py
if not external_subject:
    raise HTTPException(status_code=401, detail={
        "code": "authentication_required",
        "message": "Authentication is required.",
    })
principal = AccessRepository(db).find_active_principal(external_subject)
```

Site authorization is database-backed. An account manager can access a site through an active customer assignment; other access requires an effective site grant. Missing, inactive, and unauthorized sites deliberately use the same `404 resource_unavailable` response to avoid exposing resource existence.

```python
# backend/app/services.py
if principal.role == UserRole.ACCOUNT_MANAGER.value:
    if access.has_customer_assignment(principal.id, site.customer_id, now):
        return site

if not access.has_site_grant(principal.id, site_id, now):
    raise safe_denial()
```

## Implemented HTTP API

| Endpoint | Current behavior |
| --- | --- |
| `POST /api/v1/meter-uploads` | Accepts a `.csv` upload for an authorized operations user, records upload provenance, and queues ingestion. |
| `GET /api/v1/meter-uploads/{upload_id}` | Returns the authorized upload status and validation summary. |
| `GET /api/v1/sites/{site_id}/consumption` | Returns authorized daily, weekly, or monthly totals from derived daily-consumption records. |
| `GET /api/v1/sites/{site_id}/daily-analytics` | Returns per-day consumption, baseline, deviation, threshold, and anomaly state. |
| `GET /api/v1/sites/{site_id}/benchmark` | Returns an explicit unavailable state because peer governance integration is not configured. |
| `GET /api/v1/account-manager/alerts` | Lists alerts restricted to the requesting manager’s current customer portfolio. |
| `GET /api/v1/account-manager/customer-ranking` | Ranks authorized portfolio customers by anomaly count for a date range. |
| `POST /api/v1/exports` | Creates an authorized durable CSV or PDF export request. |
| `GET /api/v1/exports/{export_id}` | Returns an authorized export lifecycle status. |
| `GET /api/v1/exports/{export_id}/download` | Streams a completed CSV export after reauthorization. |

Consumption grouping occurs in the route after service retrieval. Empty results are represented as `no_data`, rather than as an error.

```python
# backend/app/main.py
return ConsumptionResponse(
    site_id=site_id,
    from_date=query.from_date,
    to_date=query.to_date,
    granularity=query.granularity,
    state="available" if grouped else "no_data",
    periods=[...],
)
```

Peer benchmarking is intentionally fail-closed at the API boundary.

```python
# backend/app/main.py
return BenchmarkResponse(
    site_id=site_id,
    state="unavailable",
    reason_code="peer_governance_not_configured",
)
```

## Persistence model

`backend/app/models.py` defines SQLAlchemy mappings for customers, sites, local user accounts, grants, account-manager assignments, uploads, readings, daily consumption, daily analytics, alerts, benchmark snapshots, export requests, processing jobs, and audit events.

The processing model has explicit lifecycle values:

```python
# backend/app/models.py
class LifecycleStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REJECTED = "rejected"
```

Uploads retain CSV source payload text, a SHA-256 checksum, visible validation summary, uploader identity, and lifecycle status. Readings link to the source upload. Derived daily consumption is versioned through a uniqueness constraint on site, date, and calculation version.

```python
# backend/app/models.py
class DailyConsumption(Base):
    __table_args__ = (
        UniqueConstraint("site_id", "consumption_date", "calculation_version"),
        Index("ix_consumption_site_date", "site_id", "consumption_date"),
    )
```

`ProcessingJob` records durable work, a unique idempotency key, attempts, correlation ID, lease expiry, and failure category. Its indexed status and lease fields support worker polling and database locking.

```python
# backend/app/models.py
class ProcessingJob(Base):
    __table_args__ = (
        UniqueConstraint("idempotency_key"),
        Index("ix_job_status_lease", "status", "lease_expires_at"),
    )
```

## Ingestion and analytics

An authorized upload is committed together with an ingestion job and an audit event. The job’s idempotency key is based on the upload checksum and site identifier.

```python
# backend/app/services.py
ProcessingJob(
    job_type="ingestion",
    resource_type="meter_upload",
    resource_id=upload.id,
    idempotency_key=f"ingestion:{upload.checksum}:{site_id}",
    correlation_id=correlation_id,
)
```

CSV validation requires `timestamp` and `kwh` headers, timezone-aware ISO timestamps, non-negative decimal values, and at least one data row. Validation failures produce a rejected upload summary without inserting readings.

```python
# backend/app/services.py
if not reader.fieldnames or not {"timestamp", "kwh"}.issubset(set(reader.fieldnames)):
    return [], {"state": "rejected", "code": "required_headers_missing"}
...
if timestamp.tzinfo is None:
    return [], {"state": "rejected", "code": "timestamp_timezone_required", "row": row_number}
if kwh < 0:
    return [], {"state": "rejected", "code": "negative_kwh", "row": row_number}
```

For each day with source readings, analytics calculates a baseline only when all 28 preceding calendar days are present. An anomaly requires a deviation strictly greater than the configured threshold; an equal deviation is not anomalous.

```python
# backend/app/services.py
baseline = sum(history, Decimal("0")) / len(history) if len(history) == 28 else None
deviation = ((total - baseline) / baseline * Decimal("100")) if baseline and baseline > 0 else None
anomalous = bool(
    deviation is not None and deviation > settings.anomaly_threshold_percent
)
```

## Worker and export lifecycle

The dedicated worker claims the earliest queued job using `FOR UPDATE SKIP LOCKED`, marks it processing, increments attempts, and assigns a five-minute lease.

```python
# backend/app/worker.py
job = db.scalar(
    select(ProcessingJob)
    .where(ProcessingJob.status == LifecycleStatus.QUEUED.value)
    .order_by(ProcessingJob.created_at)
    .with_for_update(skip_locked=True)
)
```

Ingestion jobs call `process_upload`. Export jobs complete CSV requests, while PDF requests are marked rejected with `pdf_storage_not_configured`. Completed CSV downloads are generated in memory from derived consumption data; no storage URL is returned by the API.

```python
# backend/app/worker.py
export.status = (
    LifecycleStatus.COMPLETED.value
    if export.output_format == "csv"
    else LifecycleStatus.REJECTED.value
)
export.failure_category = (
    None if export.output_format == "csv" else "pdf_storage_not_configured"
)
```

## Errors, audit evidence, and telemetry

Exception handlers normalize expected HTTP errors, validation errors, SQLAlchemy failures, and unexpected exceptions into safe JSON envelopes with a correlation ID. Database and unexpected failures use the public `internal_error` response rather than exposing implementation diagnostics.

```python
# backend/app/errors.py
ERROR_MAPPINGS = {
    "persistence": ErrorMapping(
        status_code=500,
        code="internal_error",
        message="The request could not be completed.",
    ),
}
```

The telemetry formatter emits newline-delimited JSON with an explicit allowlist of operational fields. It does not serialize arbitrary record attributes, preventing fields such as `database_url` and `source_payload` from being output merely because they are attached to a log record.

```python
# backend/app/telemetry.py
for field in (
    "method", "route", "status_code", "duration_ms", "error_code",
    "job_id", "job_type", "attempt", "resource_type", "resource_id",
    "failure_category",
):
```

Audit records persist actor, action, resource, outcome, correlation ID, timestamp, and optional safe metadata. Upload creation and export creation currently write audit events.

## Schema migration and operations

Schema creation is a separate deployment operation, not API startup behavior. `python -m app.migrations` creates a `schema_migration` table, runs SQLAlchemy `Base.metadata.create_all` for the initial revision when required, then records `0001_initial_schema`.

```python
# backend/app/migrations.py
if applied is None:
    Base.metadata.create_all(bind=connection)
    connection.execute(
        text("INSERT INTO schema_migration (revision) VALUES (:revision)"),
        {"revision": INITIAL_REVISION},
    )
```

The backend README identifies the required operational commands:

```bash
cd backend
python -m app.migrations
pytest tests/unit
```

## Verified automated coverage

The two current unit-test modules verify:

- reversed date ranges are rejected;
- required CSV headers, timezone-aware timestamps, and valid row normalization;
- the strict anomaly-threshold boundary;
- queued job selection behavior;
- safe expected, validation, and unexpected error envelopes;
- structured-log field allowlisting.

The tests use an in-memory SQLite database for the job-claim repository test. They do not constitute an end-to-end PostgreSQL migration, API authorization, or background-worker integration suite.

## Current limitations and operational considerations

- The application will not import successfully without a deployment-provided `DATABASE_URL`.
- The product feature flag defaults to disabled, so `FEATURE_ENERSIGHT_ENABLED=true` is required for product endpoints to operate.
- The current external-identity boundary is the `X-External-Subject` request header; token validation or an identity-provider adapter is not implemented in the reviewed source.
- Peer benchmark data is not implemented at the HTTP layer; callers receive `peer_governance_not_configured`.
- CSV exports can complete and download in memory. PDF export requests are deliberately rejected until storage and template adapters exist.
- The worker records retry-oriented failure categories, but `run_once` does not requeue failed jobs itself; externally invoking the worker again only selects queued jobs.
- The migration runner establishes only the initial revision with `create_all`; future model changes require explicit upgrade logic to preserve an upgrade path.
