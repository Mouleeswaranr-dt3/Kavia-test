---
id: "enersight-stage-4-backend-implementation-artifacts"
type: "detailed-design"
title: "EnerSight Stage 4 Backend Implementation Artifacts"
status: "draft"
owner: "Backend Lead"
tags:
  - "enersight"
  - "backend"
  - "fastapi"
  - "sqlalchemy"
  - "postgresql"
  - "stage-4"
roadmap_item_id: "enersight-analytics-mvp"
roadmap_item_json_path: "kavia-docs/CodeWiki/Artifacts/SpecBuilder/json/roadmap_items/enersight-analytics-mvp.json"
---

[CodeWiki](../../index.md) / [Specs](../index.md) / [Detailed Designs](index.md)

# EnerSight Stage 4 Backend Implementation Artifacts

## Executive Summary

This document provides the implementation-ready backend artifact design for Stage 4 of EnerSight Analytics. It converts the approved modular-monolith architecture, API contracts, data model, core-module design, and local-development prerequisites into a concrete backend package layout and module contracts. It deliberately does not provide complete FastAPI endpoint implementations, migration scripts, provider SDK integrations, or unapproved policy defaults.

The backend is a modular FastAPI application backed by PostgreSQL through SQLAlchemy. A separately runnable worker shares the same domain services and persistence model to process uploads, analytics, alert creation, and exports as durable jobs. HTTP routers own transport concerns, services own policy-aware orchestration, repositories own persistence operations, models own relational mappings, and schemas own public request and response contracts.

## Requirements

The implementation must expose only the approved `/api/v1` resource surface for meter uploads, site consumption and analytics, peer benchmarks, account-manager alerts and rankings, and exports. Every externally initiated operation must authenticate the requester, make an authorization decision, and constrain persistence queries to the authorized site, customer, assignment portfolio, or export resource.

The implementation must retain immutable upload provenance, accepted readings, versioned derived daily facts, alert records, benchmark availability outcomes, export lifecycle records, durable jobs, and safe audit evidence. Long-running upload parsing, calculation, alert generation, and report generation must return observable status instead of claiming completion during the initiating HTTP request.

The implementation must preserve explicit states for no data, unavailable baseline, unavailable benchmark, validation rejection, queued work, processing work, completion, and failure. It must not replace unavailable information with zero, infer peer data, permit cross-customer data access, or expose raw meter readings, credentials, access tokens, database URLs, storage references, or internal exception details in client responses or logs.

## Detailed Design

### Backend Folder Structure

The following proposed package layout establishes a clear dependency direction. The `api` and `workers` packages are process entry boundaries, while the `domain`, `repositories`, `models`, schemas, integrations, database, core, and telemetry packages are shared application modules.

```text
backend/
  app/
    main.py
    api/
      v1/
        router.py
        routes/
          meter_uploads.py
          sites.py
          account_manager.py
          exports.py
    core/
      config.py
      dependencies.py
      errors.py
      logging.py
      security.py
    db/
      base.py
      session.py
      migrations/
    domain/
      authorization/
        service.py
        contracts.py
        results.py
      ingestion/
        service.py
        csv_validator.py
        contracts.py
      analytics/
        service.py
        calculations.py
        contracts.py
      alerts/
        service.py
        contracts.py
      ranking/
        service.py
        contracts.py
      benchmark/
        service.py
        contracts.py
      exports/
        service.py
        contracts.py
      jobs/
        service.py
        contracts.py
    integrations/
      identity.py
      master_data.py
      peer_data.py
      object_storage.py
    models/
      customer.py
      site.py
      user_account.py
      access.py
      meter_upload.py
      meter_reading.py
      daily_consumption.py
      daily_analytic.py
      anomaly_alert.py
      benchmark_snapshot.py
      export_request.py
      processing_job.py
      audit_event.py
    repositories/
      access_repository.py
      meter_upload_repository.py
      meter_reading_repository.py
      analytics_repository.py
      alert_repository.py
      benchmark_repository.py
      export_repository.py
      job_repository.py
      audit_repository.py
    schemas/
      common.py
      meter_uploads.py
      consumption.py
      analytics.py
      alerts.py
      rankings.py
      benchmarks.py
      exports.py
    telemetry/
      audit.py
      events.py
    workers/
      runner.py
      job_handlers.py
  tests/
    unit/
      domain/
      core/
      schemas/
    integration/
      repositories/
      api/
      workers/
      integrations/
```

The dependency direction is `api or worker -> domain service -> repository or integration adapter -> model and database`. Schemas are transport-only types used at the API boundary, and domain contracts are internal typed commands and outcomes. Repositories must not return public API schemas, and domain services must not depend on FastAPI request or response objects.

### Router Definitions

The version router in `api/v1/router.py` composes the four approved resource routers beneath `/api/v1`. Shared dependencies provide the authenticated principal, database unit of work, correlation identifier, typed configuration, and centralized error mapping. Router modules may validate transport input and map typed service outcomes to public response schemas, but they must not contain SQLAlchemy queries, CSV parsing, business arithmetic, durable-job transition rules, or provider SDK calls.

| Router module | Responsibility | Inputs | Outputs | Dependencies |
| --- | --- | --- | --- | --- |
| `api/v1/router.py` | Composes versioned route modules and installs shared route-level dependencies. | Application configuration and router instances. | The approved `/api/v1` route tree. | FastAPI application, route modules, core dependencies. |
| `routes/meter_uploads.py` | Creates authorized upload requests and reads authorized upload provenance and status. | Authenticated principal, multipart CSV, target `site_id`, and `upload_id` path value. | Upload creation result or authorized status with safe validation findings. | Upload service, upload schemas, principal dependency, correlation context. |
| `routes/sites.py` | Serves authorized consumption, daily analytic, and benchmark views for one site. | Authenticated principal, `site_id`, date range, granularity, and comparison period. | Explicit data, no-data, unavailable-baseline, or benchmark-unavailable response states. | Consumption, analytics, and benchmark services; query schemas. |
| `routes/account_manager.py` | Serves alerts and customer rankings restricted to the manager's current portfolio. | Authenticated principal, optional approved filters, ranking criterion, and ranking period. | Authorized alert list or ranking result that identifies the selected criterion and period. | Alert and ranking services; alert and ranking schemas. |
| `routes/exports.py` | Creates export requests, retrieves export state, and authorizes download. | Authenticated principal, export command, `export_id`, and requested format. | Queued, processing, completed, failed, rejected, or explicit no-data export outcome. | Export service, export schemas, principal dependency. |

The approved router-to-service mapping is as follows:

| HTTP method and path | Router module | Domain operation |
| --- | --- | --- |
| `POST /meter-uploads` | `meter_uploads.py` | Create authorized upload provenance and ingestion job. |
| `GET /meter-uploads/{upload_id}` | `meter_uploads.py` | Read upload status within authorized scope. |
| `GET /sites/{site_id}/consumption` | `sites.py` | Read scoped daily, weekly, or monthly consumption. |
| `GET /sites/{site_id}/daily-analytics` | `sites.py` | Read scoped daily analytic facts. |
| `GET /sites/{site_id}/benchmark` | `sites.py` | Read a governed benchmark or explicit unavailable state. |
| `GET /account-manager/alerts` | `account_manager.py` | Read alerts within assigned-customer scope. |
| `GET /account-manager/customer-ranking` | `account_manager.py` | Rank assigned customers for the selected approved criterion and period. |
| `POST /exports` | `exports.py` | Create an authorized export request and generation job. |
| `GET /exports/{export_id}` | `exports.py` | Read authorized export lifecycle status. |
| `GET /exports/{export_id}/download` | `exports.py` | Reauthorize and stream a completed export. |

### Service Layer Design

Services own business orchestration and return typed outcomes. An expected business outcome, such as no data, unavailable benchmark, or unavailable baseline, is represented by a result type rather than an exception. Services use explicit authorization scopes when reading or changing protected records, and they pass those scopes into repositories as constraints.

| Service module | Responsibility | Inputs | Outputs | Dependencies |
| --- | --- | --- | --- | --- |
| `authorization/service.py` | Resolves a principal to an active local account and evaluates action-specific site, customer, portfolio, or export access. | Authenticated external subject, requested action, resource context, and evaluation time. | Allowed scoped authorization result or safe denial outcome. | Identity adapter, access repository, user account persistence. |
| `ingestion/service.py` | Creates immutable upload provenance and schedules ingestion after confirming target-site authorization. | Principal, target site, file metadata, checksum, safe storage reference, and correlation identifier. | Upload identifier, initial lifecycle status, and job identifier. | Authorization service, upload repository, job repository, audit writer. |
| `ingestion/csv_validator.py` | Validates a persisted file according to approved CSV policy. | File stream or provider reference and typed CSV policy. | Accepted parsed rows or a safe rejected validation summary. | CSV policy configuration, clock, parsing library selected during implementation. |
| `analytics/service.py` | Builds daily consumption facts and daily analytic facts from accepted readings. | Site, affected date range, calculation version, policy version, and processing context. | Persisted daily facts, baseline availability, deviation, anomaly state, and calculation statistics. | Reading repository, analytics repository, site context, calculation policy. |
| `alerts/service.py` | Creates alerts only for qualifying anomalous analytics with an active assignment and lists alerts for an authorized manager. | Persisted anomalous analytic or manager scope and filters. | Created alert, no-assignee outcome, or authorized alert list. | Analytics repository, access repository, alert repository, audit writer. |
| `ranking/service.py` | Produces a manager's assigned-customer ranking for an approved period and criterion. | Manager scope, ranking criterion, period, and approved ranking-policy version. | Ordered ranking rows with criterion, period, and explicit no-data treatment. | Access repository, analytics repository. |
| `benchmark/service.py` | Resolves authorized site context and requests a governed peer aggregate. | Authorized site scope and comparison period. | Available benchmark result or explicit unavailable state with safe reason code. | Authorization service, site repository or master-data adapter, peer-data adapter. |
| `exports/service.py` | Authorizes export creation, manages lifecycle reads, and reauthorizes completed-file download. | Principal, site, date range, format, export identifier, and correlation identifier. | Export request state, no-exportable-data outcome, or authorized file-stream descriptor. | Authorization service, analytics repository, export repository, job repository, object-storage adapter. |
| `jobs/service.py` | Creates, claims, retries, completes, rejects, and fails durable work. | Job type, related resource, idempotency key, worker identity, and failure classification. | Atomically transitioned job record and retry scheduling decision. | Job repository, audit writer, telemetry publisher, clock. |

The worker invokes service-level operations through `workers/job_handlers.py`. A handler receives a claimed job and its persisted resource identifier; it does not receive a browser principal or independently expand authorization scope. The handler loads only the resource referenced by the job, uses the service designed for that resource, records a terminal result, and emits safe audit and operational events.

### Repository Layer Design

Repositories encapsulate SQLAlchemy query construction and persistence mutations. They accept either a previously authorized scope or a resource identifier that the calling service already verified. They return model instances or internal domain records, never FastAPI responses or Pydantic API output models. Transaction ownership belongs to a service-level unit-of-work boundary so related changes either commit together or roll back together.

| Repository module | Responsibility | Inputs | Outputs | Dependencies |
| --- | --- | --- | --- | --- |
| `access_repository.py` | Finds local users, effective site grants, and account-manager assignments at a point in time. | External subject, user identifier, site or customer identifier, and evaluation time. | Active user/access/assignment records or absence. | SQLAlchemy session; `user_account`, grant, and assignment models. |
| `meter_upload_repository.py` | Persists immutable upload provenance and reads upload records under constrained scope. | Upload creation record, upload identifier, allowed site or uploader scope. | Upload record and safe processing metadata. | SQLAlchemy session; `meter_upload` model. |
| `meter_reading_repository.py` | Persists accepted readings and retrieves accepted readings by site and time range. | Upload identifier, site identifier, normalized accepted rows, and processing range. | Insert counts and internal reading records. | SQLAlchemy session; `meter_reading` model. |
| `analytics_repository.py` | Writes and reads versioned daily consumption and daily analytic facts. | Site, local-date range, calculation version, and derived facts. | Persisted or queried internal daily records. | SQLAlchemy session; daily fact models. |
| `alert_repository.py` | Creates eligible alerts and lists alerts only for authorized assigned portfolios. | Alert creation command, manager identifier, assigned customer identifiers, and filters. | Alert records and ordered alert list. | SQLAlchemy session; `anomaly_alert` model. |
| `benchmark_repository.py` | Optionally retains governed benchmark snapshots and their availability evidence. | Site, period, cohort-policy version, availability state, and safe aggregate values. | Stored or retrieved benchmark snapshot. | SQLAlchemy session; `benchmark_snapshot` model. |
| `export_repository.py` | Creates export requests and advances status after secure storage completion or terminal failure. | Export command, export identifier, requester/allowed scope, status transition, safe storage locator, and expiry. | Export request record. | SQLAlchemy session; `export_request` model. |
| `job_repository.py` | Creates and atomically claims or transitions durable jobs. | Job creation command, job identifier, expected status, worker identity, lease time, attempt count, and terminal category. | Claimed or transitioned job, or a no-claim result. | SQLAlchemy session; `processing_job` model. |
| `audit_repository.py` | Persists immutable security and operational audit evidence. | Actor, action, resource, outcome, correlation identifier, and safe metadata. | Audit event identifier. | SQLAlchemy session; `audit_event` model. |

Repository queries must use indexes that support site and date-range retrieval, active site grants, active manager assignments, manager alert listing, requester export status, and job claims. Dashboard queries should read versioned derived daily facts rather than aggregating raw readings during each request.

### SQLAlchemy Model Design

SQLAlchemy models map PostgreSQL tables and enforce durable relationships, non-null requirements, foreign keys, lifecycle state fields, and uniqueness constraints appropriate to the approved design. Final column widths, enum implementation, timestamp precision, partitioning, retention, and data-volume strategy remain implementation choices that must follow the approved policy and operational requirements.

| Model module | Responsibility | Inputs | Outputs | Dependencies |
| --- | --- | --- | --- | --- |
| `customer.py` | Maps a commercial customer organization and lifecycle state. | Customer master-data identity and display attributes. | Customer relationship used by sites, assignments, and alerts. | SQLAlchemy base; `site` and assignment relationships. |
| `site.py` | Maps a metered customer site, business category reference, timezone, and lifecycle state. | Customer foreign key and approved site metadata. | Site relationship for uploads, readings, daily facts, benchmarks, and exports. | Customer model; PostgreSQL foreign key and indexes. |
| `user_account.py` | Maps one external identity subject to a local role and status. | External subject, role, and lifecycle status. | User relationship used by grants, assignments, uploads, alerts, exports, and audit events. | SQLAlchemy base; unique external-subject constraint. |
| `access.py` | Maps effective `site_access_grant` and `account_manager_assignment` relationships. | User/customer/site references, access role, and effective interval. | Authorization relationship records. | User, customer, and site models; effective-date indexes. |
| `meter_upload.py` | Maps immutable file submission provenance and processing state. | Authorized site, uploader, checksum, source-file reference, received time, and validation summary. | Upload relationship to accepted readings and related jobs. | Site and user models; status constraint. |
| `meter_reading.py` | Maps accepted timestamped kWh readings associated with an upload and site. | Upload, site, observed timestamp, normalized kWh value, and any approved uniqueness key. | Source facts used only after successful acceptance. | Upload and site models; final duplicate-policy constraint. |
| `daily_consumption.py` | Maps versioned daily site-local total consumption and coverage state. | Site, local consumption date, total, calculation version, and coverage state. | Derived daily fact for dashboard, analytics, ranking, and export reads. | Site model; unique site/date/version constraint. |
| `daily_analytic.py` | Maps an evaluation of one daily-consumption fact. | Daily fact, nullable baseline, nullable deviation, threshold, anomaly flag, calculation and policy versions. | Explainable analytic fact and potential alert input. | Daily consumption model; baseline/anomaly invariants. |
| `anomaly_alert.py` | Maps assignment-constrained account-manager alert lifecycle. | Analytic, customer, site, assignee, suggested-action version, status, and created time. | Authorized manager alert record. | Customer, site, user, and analytic models. |
| `benchmark_snapshot.py` | Maps a governed aggregate result or explicit unavailable outcome. | Site, period, cohort-policy version, availability reason, and permitted aggregate metrics. | Safe cached benchmark evidence where retention is approved. | Site model; governed peer-data contract. |
| `export_request.py` | Maps authorized export lifecycle metadata. | Requester, site, date range, output format, status, protected locator, and expiry. | Export status and internal storage retrieval metadata. | User and site models; format/status constraints. |
| `processing_job.py` | Maps durable asynchronous work and recovery metadata. | Job type, related resource, idempotency key, lifecycle state, lease, attempts, and failure category. | Claimable job state and terminal outcome evidence. | SQLAlchemy base; indexes for status and lease expiry. |
| `audit_event.py` | Maps immutable safe audit evidence. | Actor, action, resource, outcome, correlation identifier, timestamp, and safe metadata. | Compliance and operational evidence without raw meter readings. | User model when applicable; append-only write pattern. |

The minimum model invariants are as follows:

| Invariant | Model enforcement and service enforcement |
| --- | --- |
| An accepted reading must belong to both an upload and its target site. | Foreign keys enforce relationship existence; ingestion service verifies the upload is accepted before insertion. |
| A rejected upload cannot yield accepted readings, analytics, alerts, or downstream processing. | Service transaction and job transition logic block downstream creation; status checks guard repository mutations. |
| A daily analytic without a valid positive baseline cannot be anomalous. | Service calculation guards this outcome; database check constraints may enforce compatible nullable fields where practical. |
| An anomaly alert requires a qualifying analytic and active account-manager assignment. | Foreign keys preserve analytic identity; alert service verifies the active assignment before creation. |
| An export storage locator is not a public download URL. | Export model stores an internal protected locator only; service asks the storage adapter to stream or mint access after reauthorization. |
| A durable job transition must be valid and attributable. | Job service uses expected-state updates, attempts, lease metadata, correlation identifier, and terminal categories. |

### Pydantic Schema Design

The Pydantic schema package represents public HTTP contracts. Input schemas reject malformed transport data before a service is called. Output schemas expose stable public fields and explicit state information, but they do not expose persistence-only fields such as internal storage locations, provider diagnostics, secrets, or unredacted audit metadata.

| Schema module | Responsibility | Inputs | Outputs | Dependencies |
| --- | --- | --- | --- | --- |
| `common.py` | Defines shared identifiers, date-range values, correlation metadata, and standard error shape. | Header and common query/path values. | `ErrorResponse`, safe details, and correlation identifier. | Pydantic, shared enum/value types. |
| `meter_uploads.py` | Defines multipart-associated metadata and upload status responses. | `site_id` and file metadata available at the transport boundary. | Upload identifier, processing status, and safe validation summary. | Common schemas; upload lifecycle values. |
| `consumption.py` | Defines consumption query parameters and period-value responses. | `from_date`, `to_date`, and `granularity`. | Selected range, granularity, period rows, and explicit data state. | Common schemas; approved granularity enum. |
| `analytics.py` | Defines daily analytics query and response shapes. | Date range and path site identifier. | Actual consumption, nullable baseline and deviation, anomaly flag, threshold, and availability state. | Common schemas; decimal/date values. |
| `alerts.py` | Defines account-manager alert filters and safe alert summaries. | Optional approved filters and pagination only if approved. | Alert identifier, authorized customer/site context, anomaly date, deviation, suggested action, and state. | Common schemas; alert lifecycle values. |
| `rankings.py` | Defines ranking queries and ordered portfolio results. | Ranking criterion and period. | Criterion, period, ordered customer rows, and no-data state. | Common schemas; approved ranking criterion enum. |
| `benchmarks.py` | Defines comparison-period query values and benchmark result states. | Comparison period. | Available aggregate comparison or explicit unavailable reason code. | Common schemas; benchmark availability enum. |
| `exports.py` | Defines export creation, lifecycle status, and download-ready response metadata. | Site identifier, inclusive date range, and CSV/PDF format. | Export identifier, lifecycle state, safe failure category, expiry metadata, and download availability. | Common schemas; export format and status values. |

The external response contract should distinguish the following successful domain states:

| Contract area | Required explicit states |
| --- | --- |
| Consumption | `available` and `no_data`. |
| Daily analytics | `available` and `baseline_unavailable` at the relevant daily result level. |
| Benchmark | `available` and `unavailable` with a safe reason code. |
| Upload | `queued`, `processing`, `completed`, `failed`, and `rejected`. |
| Export | `queued`, `processing`, `completed`, `failed`, `rejected`, and a no-exportable-data outcome where the contract requires it. |
| Ranking and alerts | A populated result or an explicit empty/no-data result rather than an implied error. |

### Validation Rules

Validation occurs at two layers. Pydantic schemas validate transport syntax and enumerated values. Domain validators enforce business rules, data-quality policy, lifecycle transitions, and authorization-dependent constraints. Neither layer may silently decide a policy that is documented as unresolved.

| Area | Required validation | Owner |
| --- | --- | --- |
| Authentication context | A principal must be present and successfully normalized before any protected operation. | Security dependency and authorization service. |
| Resource identifiers | Site, upload, and export identifiers must have the approved identifier shape. Invalid syntax is a request validation error. | Pydantic path/query schemas. |
| Date range | Start and end dates must be parseable; start must not be after end; range limits remain a policy gate until approved. | Pydantic schema and export/analytics service. |
| Granularity | Consumption granularity is limited to `daily`, `weekly`, or `monthly`. | Consumption schema. |
| Export format | Export format is limited to approved enabled values, initially CSV and PDF only after the relevant enablement gate is satisfied. | Export schema and configuration/service layer. |
| Upload target | A CSV upload identifies one target site unless a future approved contract explicitly adds multi-site ingestion. | Upload schema and ingestion service. |
| CSV structure | Required timestamp and kWh headers must exist according to the approved CSV policy version. | CSV validator. |
| CSV row values | Timestamp values must be parseable and kWh values numeric under approved timezone and unit rules. | CSV validator. |
| Ambiguous CSV cases | Duplicate, partial-validity, multi-site, timestamp, timezone, file-size, and row-limit cases are rejected or quarantined until policy is approved. | CSV validator and ingestion service. |
| Baseline | The baseline considers exactly the 28 calendar days preceding the evaluated day and excludes that evaluated day. It remains unavailable when the approved minimum-data policy is unmet. | Analytics calculation service. |
| Anomaly | Deviation is `(actual - baseline) / baseline * 100`; anomaly is true only when a valid positive baseline exists and deviation is strictly greater than the active threshold. | Analytics calculation service. |
| Alert eligibility | Alert creation requires a qualifying anomaly and active assignment for the owning customer. | Alert service. |
| Benchmark eligibility | The service returns an unavailable state unless the peer adapter establishes approved governed cohort eligibility. | Benchmark service and peer adapter. |
| Export access | Export creation and download each require an authorization decision; completed-file access is rechecked at download time. | Export service and authorization service. |
| Job transition | A transition must originate in the expected state and respect bounded retry and terminal-state rules. | Job service. |

### Error Handling

The `core/errors.py` module centralizes exception translation. Routers convert recognized service exceptions into the standard error envelope and include the correlation identifier. Services use typed outcomes for normal business states and reserve exceptions for invalid commands that bypass schema validation, violated invariants, unavailable required dependencies, persistence failures, and unexpected faults.

| Category | HTTP/API behavior | Worker behavior |
| --- | --- | --- |
| Missing or invalid authentication | Return the approved authentication failure without exposing resource information. | Do not begin protected work without a persisted authorized origin. |
| Authorization denial | Return safe denial behavior that does not confirm inaccessible resource existence. | Stop work outside the persisted resource scope and record safe audit evidence. |
| Request validation failure | Return a stable invalid-request code with field-safe details. | Treat persisted malformed commands as non-retryable failed or rejected work. |
| CSV validation failure | Return or expose a rejected upload outcome with safe correctable findings. | Persist rejection, do not write accepted readings, and do not create downstream analytics or alert work. |
| No data | Return successful typed `no_data` state. | Do not produce misleading derived data or exports. |
| Baseline unavailable | Return successful typed unavailable state with nullable baseline. | Do not flag an anomaly or create an alert from the day. |
| Benchmark unavailable | Return successful typed unavailable state and safe reason. | Do not derive a fallback comparison. |
| External dependency failure | Return safe dependency failure when synchronous work cannot continue. | Retry only if classified retryable; otherwise fail with a safe category. |
| Persistence or invariant failure | Return a generic internal error with correlation identifier. | Roll back the current transaction where possible and record a terminal safe failure. |
| Unexpected failure | Return a generic internal error without stack trace or provider details. | Mark failed after safe logging, audit, and bounded retry evaluation. |

The standard error envelope contains a stable machine-readable `code`, a user-safe `message`, optional safe `details`, and `correlation_id`. It must never contain stack traces, raw CSV values, unfiltered provider responses, database error strings, access tokens, secret configuration, or storage locations.

### Logging Strategy

`core/logging.py` configures structured application and worker logging. Every record should include an event name, timestamp, severity, correlation identifier, process role, and outcome. When available and safe, records should additionally include job identifier, upload identifier, export identifier, resource type, duration, count, calculation version, policy version, and failure category.

| Event family | Required safe fields | Explicitly excluded fields |
| --- | --- | --- |
| Request lifecycle | Event name, method, route template, status category, duration, correlation identifier. | Authorization header, token, raw request body, multipart content. |
| Authorization | Principal reference where approved, action, resource type, allowed/denied outcome, correlation identifier. | Raw provider claims, credentials, inaccessible resource details. |
| Upload lifecycle | Upload identifier, target-site safe identifier, file size, state, accepted/rejected row counts where approved, duration. | CSV contents and raw rows. |
| Job lifecycle | Job identifier, type, attempt, claim/terminal state, duration, retry classification, correlation identifier. | Raw exception stack trace in normal logs and secret provider details. |
| Analytics and alerts | Site safe identifier, evaluated date, calculation/policy versions, threshold, anomaly outcome, alert creation outcome. | Unnecessary raw meter-reading payloads. |
| Benchmark | Site safe identifier, availability outcome, governed reason code, policy version. | Peer identities, raw peer readings, unsafe cohort details. |
| Export | Export identifier, format, status, duration, expiry status, download authorization outcome. | Internal storage locator, signed URL, report content. |

Audit events are distinct from diagnostic logs. `telemetry/audit.py` records access decisions, upload creation and outcomes, analytics completion, alert creation, export creation, export download authorization, and material job outcomes. `telemetry/events.py` emits the approved product telemetry events using safe identifiers and no raw meter readings or unnecessary personal data.

### Unit Test Structure

Unit tests isolate calculations and service policy decisions from FastAPI, PostgreSQL, object storage, identity providers, peer-data providers, clocks, and queue technology. They use fakes or mocks for repositories and adapters, asserting observable domain outcomes and collaborator calls rather than private implementation details.

```text
backend/tests/
  unit/
    core/
      test_config_validation.py
      test_error_mapping.py
      test_correlation_context.py
    schemas/
      test_consumption_schemas.py
      test_export_schemas.py
      test_upload_schemas.py
    domain/
      authorization/
        test_authorization_service.py
      ingestion/
        test_upload_service.py
        test_csv_validator.py
      analytics/
        test_daily_aggregation.py
        test_rolling_baseline.py
        test_anomaly_detection.py
      alerts/
        test_alert_service.py
      ranking/
        test_ranking_service.py
      benchmark/
        test_benchmark_service.py
      exports/
        test_export_service.py
      jobs/
        test_job_service.py
  integration/
    repositories/
      test_access_repository.py
      test_analytics_repository.py
      test_job_repository.py
    api/
      test_meter_upload_routes.py
      test_site_routes.py
      test_account_manager_routes.py
      test_export_routes.py
    workers/
      test_ingestion_handler.py
      test_export_handler.py
    integrations/
      test_identity_contract.py
      test_peer_data_contract.py
      test_object_storage_contract.py
```

| Unit test area | Required examples |
| --- | --- |
| Authorization | Verify active and inactive site grants, active and inactive manager assignments, role constraints, ownership constraints, and safe denial behavior. |
| CSV validation | Verify missing required headers, non-parseable timestamps, non-numeric kWh values, policy-driven rejection, and the invariant that rejected input cannot create accepted readings. |
| Daily aggregation | Verify accepted readings aggregate to site-local calendar days according to the approved timezone policy boundary. |
| Rolling baseline | Verify the baseline uses exactly the 28 calendar days immediately before the evaluated day and never includes the evaluated day. |
| Anomaly detection | Verify 120 kWh against a 100 kWh baseline at 20 percent is not anomalous, 121 kWh is anomalous, and unavailable or zero baselines cannot produce anomalies. |
| Alerts | Verify a qualifying anomaly creates an alert only when the customer has an active assignment and that the alert retains required safe context. |
| Ranking | Verify results include only assigned customers, identify criterion and period, and honor the approved criterion policy. |
| Benchmarking | Verify the service returns a governed available result only from the adapter and otherwise returns explicit unavailable state. |
| Exports | Verify authorization at creation and download, explicit no-exportable-data outcome, durable-job creation, and prevention of public storage references. |
| Durable jobs | Verify valid state transitions, expected-state claim behavior, idempotency, bounded retry classification, and terminal completed, failed, or rejected outcomes. |
| Error mapping | Verify expected states remain successful results and failures produce only safe error envelopes with correlation identifiers. |

Repository, route, worker, and adapter contract tests remain required in addition to unit tests. They must use a PostgreSQL-compatible environment and representative synthetic data for at least two customers, distinct site grants, assigned and unassigned account managers, valid and invalid uploads, more than 28 days of history, no-data periods, unavailable benchmarks, and retryable and terminal job failures.

## Error Handling

The Stage 4 implementation must treat error handling as a cross-cutting module contract rather than router-specific conditional behavior. The API translates typed errors consistently, while workers classify failures consistently and preserve terminal records for operations teams. The system must fail closed where authorization, provider contracts, peer governance, CSV policy, storage configuration, or other required prerequisites are missing.

No-data, unavailable-baseline, benchmark-unavailable, and processing lifecycle states are not errors. They are explicit response states that callers can render accurately. An implementation must not use HTTP 500 responses to represent these normal domain conditions.

## Testing Strategy

Implementation begins with unit tests for pure calculations, policy outcomes, state transitions, schema validation, and safe error translation. It then adds repository tests against PostgreSQL because authorization constraints, unique keys, indexes, foreign keys, transaction boundaries, and job claims cannot be fully validated with mocks.

Route integration tests must verify the approved endpoint surface and safe authorization denial behavior. Worker-flow tests must verify that an upload or export is created by an authorized request, claimed exactly once under expected conditions, processed through the correct shared service, and finalized with safe state, audit, telemetry, and correlation evidence. Adapter contract tests are added after identity, assignment, peer-data, and secure-storage providers are selected.

## Implementation Plan

1. Establish the backend package structure, typed configuration boundary, database session and unit-of-work boundary, correlation context, structured logging configuration, and provider-neutral adapter protocols. Production startup must fail closed when required security integration configuration is absent.

2. Implement SQLAlchemy base mappings and migrations for users, customers, sites, access relationships, uploads, readings, derived facts, alerts, benchmark snapshots, exports, jobs, and audit events. Add the repository contracts and indexes required by authorized queries and durable work.

3. Implement authorization and job services before all feature services. Every subsequent service must receive an explicit scope or use an authorization service operation, and every long-running operation must use the durable job lifecycle contract.

4. Implement upload provenance, CSV validation, accepted-reading persistence, daily aggregation, rolling-baseline calculation, versioned analytics, and alert eligibility. Keep unresolved data-quality, timezone, duplicate, partial-validity, and baseline-sufficiency rules behind typed policy configuration and disabled or reject/quarantine behavior.

5. Implement read services and routers for consumption, analytics, account-manager alerts, and rankings. Implement benchmark and export modules only behind their provider and governance enablement gates, including the second authorization check for completed-file download.

6. Complete unit, repository, route, worker-flow, and selected adapter contract tests with representative synthetic data. Validate that logs, audit events, and telemetry correlate safely and exclude prohibited data before enabling the feature flag for a controlled cohort.

## Open Questions

The following decisions remain prerequisites and must not be replaced by implicit implementation defaults: identity provider, customer-site master-data source, account-manager assignment source, CSV headers and limits, duplicate and partial-validity policy, timestamp and timezone treatment, minimum-data baseline policy, threshold governance, historical recalculation and supersession behavior, ranking severity and period definitions, peer cohort and suppression governance, worker or queue technology, report template and retention policy, storage provider, download expiry, and measurable service objectives.

Benchmark and export functionality must remain disabled or return approved unavailable outcomes until their provider, governance, and storage requirements are complete. CSV ingestion must reject or quarantine ambiguous data until the corresponding policy version is approved.

## Related

This design operationalizes the [EnerSight Analytics Backend Implementation Blueprint](../../Artifacts/SpecBuilder/pages/blueprints/enersight-analytics-backend-implementation-blueprint.md), the [EnerSight Analytics MVP Architecture](../ArchitectureSpecs/enersight-analytics-mvp-architecture.md), and the [EnerSight Analytics Core Modules Low Level Design](enersight-analytics-core-modules.md). It is constrained by the [EnerSight Analytics MVP Architecture Decisions](../Decisions/enersight-analytics-mvp-decisions.md), the [Commercial Energy Consumption Analytics and Anomaly Alerts feature specification](../FeatureSpecs/commercial-energy-consumption-analytics-anomaly-alerts.md), and the [backend local development and infrastructure prerequisites](../Other/enersight-backend-local-development-prerequisites.md).
