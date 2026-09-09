# EnerSight Backend Local Development and Infrastructure Prerequisites

[CodeWiki](../../index.md) / [Specs](../index.md) / [Other Specifications](index.md)

## Purpose

This guide defines the recommended local-development environment and infrastructure prerequisites for the proposed EnerSight Analytics backend. It is intended for the backend delivery team before implementation begins and is aligned with the approved modular FastAPI architecture, PostgreSQL persistence decision, Docker packaging model, and durable-job design.

The guide deliberately does not generate application, migration, container, or infrastructure implementation code. Several provider and policy decisions remain unapproved. Where those decisions affect runtime behavior, this guide identifies a required configuration boundary and a delivery gate rather than inventing a default.

## Recommended Local Development Setup

Backend developers should use a consistent local environment that separates the API process, durable-job worker, PostgreSQL database, and any provider substitutes used only for local development. The target application is a modular FastAPI monolith using SQLAlchemy with PostgreSQL. The API and worker share domain modules and persistence models, but they run as separate processes so that long-running ingestion, analytics, alert, and export work does not execute inside an HTTP request.

A local workstation needs a supported Python runtime selected by the delivery team, a Python dependency-management workflow, Docker with Docker Compose support, and a PostgreSQL client for diagnostics. The team should standardize the selected Python version and dependency tool before STEP-01 begins so that application startup, static checks, dependency installation, and test commands are reproducible across developer machines and continuous integration.

The recommended developer workflow is to run PostgreSQL through Docker Compose and run the API and worker either directly from the local Python environment or as Docker services using the same configuration contract. Direct local processes generally provide faster debugging during early backend work. Containerized API and worker processes should also be available before integration testing so the team can validate the intended process boundaries, networking, configuration injection, and startup validation.

Development configuration must be stored in an uncommitted local environment file or an equivalent secret-management mechanism. A committed example file may document variable names and safe placeholder values, but it must not include database credentials, identity secrets, storage credentials, tokens, or signed URLs. The browser application must never receive backend-only configuration values.

## PostgreSQL Setup Approach

PostgreSQL is the authoritative store for customer and site metadata, authorization relationships, upload provenance, accepted meter readings, derived daily facts, anomalies, alerts, export lifecycle records, durable jobs, and audit evidence. The development database must therefore support relational constraints, transactions, indexed date-range retrieval, and concurrent access from the API and worker.

The preferred local approach is one isolated PostgreSQL container per developer environment, with its data held in a named Docker volume. A named volume allows routine container recreation without discarding local schema and test data, while a documented reset procedure can intentionally recreate a clean database when required. The database should be exposed only to the developer workstation by default and should not use production credentials, production customer data, or public network exposure.

The application should use a dedicated application database role rather than a PostgreSQL superuser. A separate migration-capable role can be introduced if the chosen migration process needs privileges that the runtime role should not receive. This separation supports the intended least-privilege model and makes startup failures caused by missing schema permissions visible early.

Before STEP-02, the team must agree how schema changes will be applied locally and in continuous integration. The architecture requires migrations, SQLAlchemy mappings, foreign keys, lifecycle state representation, and query indexes. A database that is only manually created or manually altered is insufficient because it cannot provide reproducible schema state for API, worker, repository, and integration tests.

The initial database must be capable of hosting representative non-production data for at least two customers, distinct sites, distinct site timezones, authorized and unauthorized users, active and inactive access grants, an assigned and an unassigned account manager, accepted and rejected upload records, daily history exceeding 28 preceding days, and durable job outcomes. This dataset is necessary to validate authorization boundaries, baseline behavior, data states, and worker transitions without using real customer meter data.

## Docker Setup Approach

Docker is the approved packaging model for the proposed MVP. Local Docker Compose should define a development topology that at minimum includes PostgreSQL and can optionally run the FastAPI API and durable worker as separate services. The worker must be independently runnable because ingestion, derived analytics, alert generation, and report generation are designed as durable operations with visible lifecycle states.

The API service should receive HTTP traffic through a configured local port and connect to PostgreSQL through the internal Docker network when containerized. The worker should use the same application configuration and database connection contract as the API, but it should expose no public HTTP port. PostgreSQL should expose a host port only when developers need direct local client access; it should remain reachable to application services on the internal Compose network regardless of host-port exposure.

Development Compose configuration should use environment-variable injection rather than embedding credentials in image definitions or configuration files. It should include health checks or equivalent readiness behavior so that the API and worker do not incorrectly treat an unavailable database as a usable dependency. Application startup validation must fail closed if required security configuration is absent. Features relying on unresolved peer-data governance, report storage, or identity contracts must remain disabled rather than silently using an unsafe substitute.

No external storage, identity, assignment, master-data, or peer-data provider has been approved for the MVP. Local development may use explicitly identified adapter substitutes only after their behavior is agreed by the relevant owners. These substitutes must not be described as production-ready integrations and must preserve the expected safe outcomes, including authorization denial, dependency-unavailable, and benchmark-unavailable states.

## Environment Variables

No container environment variables have been provided for this work item. The following names are a recommended backend configuration contract derived from the approved configuration groups. They should be finalized with the implementation foundation in STEP-01, documented in a safe example environment file, and validated at startup according to the environment.

| Group | Recommended variables | Purpose and handling |
| --- | --- | --- |
| Application | `APP_ENV`, `API_V1_PREFIX`, `FEATURE_ENERSIGHT_ENABLED`, `LOG_LEVEL`, `CORS_TRUSTED_ORIGINS`, `CORRELATION_HEADER_NAME` | Identifies the runtime environment, API prefix, controlled feature enablement, safe logging level, trusted browser origins, and correlation behavior. Production values must be deployment-injected. |
| Database | `DATABASE_URL`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_STATEMENT_TIMEOUT_MS`, `DB_MIGRATION_DATABASE_URL` | Connects the API, worker, and migration process to PostgreSQL and establishes connection and statement limits. URLs are secrets and must never be logged or embedded in frontend artifacts. |
| Security and authorization | `IDENTITY_ADAPTER`, `IDENTITY_ISSUER`, `IDENTITY_AUDIENCE`, `IDENTITY_JWKS_URL`, `IDENTITY_CLIENT_ID`, `IDENTITY_CLIENT_SECRET`, `AUTHORIZATION_SOURCE_ADAPTER` | Selects and configures the approved identity and authorization integration. The provider and assignment source are unresolved, so production startup must reject missing required values instead of applying a permissive fallback. |
| Worker and durable jobs | `WORKER_ENABLED`, `JOB_EXECUTION_ADAPTER`, `JOB_POLL_INTERVAL_SECONDS`, `JOB_CLAIM_DURATION_SECONDS`, `JOB_MAX_ATTEMPTS`, `JOB_RETRY_BACKOFF_SECONDS` | Configures the separately runnable worker and durable-job handling. The final queue or execution technology is unresolved; the selected adapter must support durable job state, claims, bounded retries, and terminal outcomes. |
| Analytics policy | `ANALYTICS_CALCULATION_VERSION`, `ANOMALY_THRESHOLD_PERCENT`, `BASELINE_MINIMUM_DATA_POLICY_VERSION`, `SITE_TIMEZONE_POLICY_VERSION` | Records calculation and policy versions. The default approved anomaly threshold is 20 percent, but the baseline sufficiency and timezone policies must be approved before affected behavior is enabled. |
| CSV policy | `CSV_POLICY_VERSION`, `CSV_REQUIRED_HEADERS`, `CSV_MAX_FILE_BYTES`, `CSV_MAX_ROWS`, `CSV_DUPLICATE_POLICY`, `CSV_PARTIAL_VALIDITY_POLICY`, `CSV_TIMESTAMP_POLICY` | Governs data acceptance. Header, duplicate, partial-validity, timestamp, timezone, size, and row-limit policy remain unresolved; ambiguous input must be rejected or quarantined until these values are approved. |
| External integrations | `MASTER_DATA_ADAPTER`, `MASTER_DATA_BASE_URL`, `MASTER_DATA_API_TOKEN`, `ASSIGNMENT_ADAPTER`, `PEER_DATA_ADAPTER`, `PEER_DATA_BASE_URL`, `PEER_DATA_API_TOKEN` | Selects customer-site, assignment, and governed peer-data integrations. Secrets must be injected securely. Benchmarking must remain unavailable unless the peer adapter can establish approved cohort eligibility and suppression rules. |
| Report storage and exports | `OBJECT_STORAGE_ADAPTER`, `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_REGION`, `OBJECT_STORAGE_ACCESS_KEY`, `OBJECT_STORAGE_SECRET_KEY`, `EXPORT_EXPIRY_SECONDS`, `EXPORT_RETENTION_POLICY_VERSION`, `EXPORT_ENABLED_FORMATS` | Configures secure external report storage and export lifecycle behavior. CSV and PDF enablement must be blocked until report content, retention, expiry, secure-download, and storage decisions are approved. |
| Observability | `TELEMETRY_ENABLED`, `TELEMETRY_ADAPTER`, `TELEMETRY_ENDPOINT`, `AUDIT_ENABLED` | Enables approved structured telemetry and audit evidence. Diagnostic logs, telemetry, and audit events must exclude raw meter readings, tokens, secrets, database URLs, storage credentials, and public download URLs. |

Configuration values must be typed and grouped by concern in the planned central configuration module. The runtime must expose safe configuration errors to operators while ensuring that response bodies and logs do not reveal secrets. A local development configuration may use non-sensitive placeholder values only for adapters that are intentionally disabled or explicitly substituted for development.

## Backend Project Structure

The following proposed structure provides the package boundaries needed by the approved architecture. It is a target layout for implementation and not an assertion that these files already exist.

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
      logging.py
      security.py
      errors.py
      dependencies.py
    domain/
      authorization/
      ingestion/
      analytics/
      alerts/
      ranking/
      benchmark/
      exports/
      jobs/
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
      customer_repository.py
      site_repository.py
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
    integrations/
      identity.py
      master_data.py
      peer_data.py
      object_storage.py
    db/
      session.py
      base.py
      migrations/
    workers/
      runner.py
      job_handlers.py
    telemetry/
      audit.py
      events.py
  tests/
    unit/
    integration/
```

The API layer is responsible for HTTP transport, request validation, authenticated-principal acquisition, response mapping, correlation context, and safe error translation. It must not own persistence queries, CSV parsing, analytics arithmetic, or provider SDK calls. The domain layer owns policy-aware orchestration, while repositories are the sole persistence boundary and integrations isolate external provider details behind provider-neutral contracts.

The worker shares domain, repository, configuration, and telemetry modules with the API. It must not duplicate service logic or acquire broad authorization scope. It processes only persisted resources created from authorized requests and records durable state transitions, attempts, outcomes, audit evidence, and correlation information.

## Infrastructure Required Before STEP-01

STEP-01 establishes the application foundation and integration contracts. Before it can begin, the team needs a confirmed development baseline rather than production-complete external services.

A development workstation standard must be agreed, including the supported Python runtime, dependency-management approach, Docker and Compose availability, and the PostgreSQL version used locally and in non-production environments. The team also needs repository-level decisions for backend location, source-control treatment of local environment files, and the commands that will later be used for dependency installation, local startup, quality checks, and tests.

A local PostgreSQL instance must be provisionable through the agreed Docker approach, with a named volume, isolated credentials, an application database, and a non-superuser application role. Connectivity must be available to both API and worker processes. The team should also decide the migration tool and ownership model before foundation work creates a database session boundary, because STEP-01 configuration must distinguish runtime database access from schema-management access.

The following cross-cutting contracts must be at least identified before STEP-01: an identity and authorization provider owner, a customer-site master-data owner, an account-manager assignment owner, a secure report-storage owner, a peer-data governance owner, and a durable-job execution owner. Provider implementations may remain deferred, but the expected adapter contracts, operational contacts, and safe disabled behavior must be known. Missing security configuration must block startup rather than permit anonymous or unrestricted operation.

The team must define a safe local fixture strategy. It must use synthetic or approved anonymized data and support the authorization and data-quality cases required by the architecture. This prerequisite prevents the foundation from being validated only against a single unrestricted user or an unrealistic empty database.

## Infrastructure Required Before STEP-02

STEP-02 implements database models, migrations, and repositories. It cannot safely begin until the PostgreSQL, schema-management, and data-governance prerequisites are sufficiently resolved.

The development and continuous-integration environments must have a repeatable PostgreSQL provisioning process. Schema creation and upgrade must be automated through the selected migration process, and test runs must be able to start from a known clean schema. The API and worker should use the runtime database role, while migrations use only the permissions necessary to create or alter the planned schema.

The entity model requires approved ownership and lifecycle information for customers, sites, users, site-access grants, and account-manager assignments. The final external source systems can still be integrated later, but STEP-02 needs an approved representation of external identifiers, effective intervals, roles, status values, and synchronization or lookup expectations. Without these, the access relationships that constrain every later repository query cannot be modeled reliably.

The team must also establish the initial state vocabulary for uploads, exports, and processing jobs. The architecture requires at least `queued`, `processing`, `completed`, `failed`, and `rejected` durable-job outcomes. It requires immutable upload provenance, versioned derived facts, protected export metadata, and audit evidence that excludes raw readings. These invariant requirements should be captured in the data model and migration plan before repositories are built.

Several policies may remain configurable, but their unapproved status must be explicit in the schema and repository design. These include CSV duplicate and partial-validity handling, site-timezone treatment, baseline minimum-data sufficiency, historical recalculation and supersession behavior, ranking severity and period definitions, peer cohort governance, report retention, and secure-download expiry. STEP-02 must not hard-code them as implied business defaults.

Finally, the team must prepare synthetic integration-test data that demonstrates at least two customer boundaries, distinct site grants, manager assignments, an unauthorized access attempt, accepted and rejected uploads, more than 28 days of usable consumption history, an unavailable baseline case, and representative job transitions. Repository-level authorization constraints and transaction behavior cannot be considered verified without this dataset.

## Deferred Decisions and Enablement Gates

The identity provider, authorization source, customer-site master-data source, account-manager assignment source, peer-data provider, secure report-storage provider, durable-job or queue technology, and final report requirements are not approved by the current architecture. Their absence does not block creation of module boundaries and configuration contracts, but it blocks enabling behavior that relies on them.

CSV acceptance policy, duplicate handling, partial-validity treatment, timestamp and timezone rules, size limits, row limits, baseline minimum-data sufficiency, threshold governance, ranking criteria, peer cohort eligibility, report retention, download policy, and measurable service objectives also remain open. The backend must fail closed, reject or quarantine ambiguous data, return explicit unavailable states, or keep the associated feature disabled until each relevant policy is approved.

## Related Documents

This guide operationalizes the setup implications of the [EnerSight Analytics Backend Implementation Blueprint](../../Artifacts/SpecBuilder/pages/blueprints/enersight-analytics-backend-implementation-blueprint.md). It remains aligned with the [EnerSight Analytics Approved Design Summary](enersight-approved-design-summary.md), [EnerSight Analytics MVP Architecture](../ArchitectureSpecs/enersight-analytics-mvp-architecture.md), [EnerSight Analytics Core Modules Low Level Design](../DetailedDesigns/enersight-analytics-core-modules.md), and [EnerSight Analytics MVP Architecture Decisions](../Decisions/enersight-analytics-mvp-decisions.md).
