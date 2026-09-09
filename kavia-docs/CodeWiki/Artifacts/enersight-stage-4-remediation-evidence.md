[CodeWiki](../index.md) / [Artifacts](index.md)

# EnerSight Stage 4 Backend Remediation Evidence

## Scope

This evidence maps the failed Stage 4 gate-review criteria to implemented source
artifacts and repeat-gate checks. It distinguishes implemented controls from
intentionally fail-closed product capabilities.

## Criterion-Level Evidence

| Gate-review criterion | Remediation status | Source evidence | Repeat-gate verification |
| --- | --- | --- | --- |
| Backend Folder Structure | Remediated foundation | `backend/app/repositories.py`, `backend/app/telemetry.py`, `backend/app/errors.py`, `backend/app/migrations.py`, and `backend/tests/unit/` establish explicit persistence, observability, error, schema-management, and test boundaries. | Inspect module responsibilities and run `pytest tests/unit` from `backend/`. |
| Router Definitions | Remediated separation | `backend/app/main.py` retains the approved ten `/api/v1` routes and delegates upload, analytics, alert, ranking, and export persistence work through `backend/app/services.py`. Route handlers do not construct SQLAlchemy `select` expressions or call `Session.get`. | Inspect the route handlers and run API integration tests when a PostgreSQL test environment is available. |
| Repository Layer Design | Remediated | `backend/app/repositories.py` provides `AccessRepository`, `UploadRepository`, `AnalyticsRepository`, `AlertRepository`, `ExportRepository`, `JobRepository`, and `AuditRepository`. Persistence query construction for authorization, analytics, uploads, exports, alerts, and jobs is isolated in repositories. | `test_job_repository_claims_one_queued_job` verifies queued-job repository selection. |
| Error Handling Strategy | Remediated | `backend/app/errors.py` contains the explicit `ERROR_MAPPINGS` registry: validation maps to `422/invalid_request`, and persistence plus unexpected failures map to `500/internal_error`. Its centrally installed handlers also normalize approved `HTTPException` responses. `backend/app/main.py` calls `install_exception_handlers(app)` before routes are served. | `test_validation_errors_use_standard_safe_envelope`, `test_expected_http_errors_use_safe_error_envelope`, and `test_unexpected_errors_use_safe_error_envelope` directly verify the mapped 422, approved 404, and safe 500 envelopes. |
| Logging Strategy | Remediated | `backend/app/telemetry.py` produces newline-delimited JSON using an allowlist of approved fields. `backend/app/main.py` records completed and unhandled failed request lifecycles. `backend/app/services.py` records upload and export queue events, while `backend/app/worker.py` records job claim, completion, and safe failure events. | `test_structured_logs_allowlist_operational_fields` proves arbitrary fields such as database URLs and source payloads are omitted. Inspect representative JSON records for correlation IDs, event names, outcomes, and safe failure categories. |
| Unit Testing Strategy | Remediated foundation | `backend/requirements.txt` includes `pytest==8.3.4`; executable tests are in `backend/tests/unit/test_stage4_foundations.py` and `backend/tests/unit/test_stage4_remediation.py`. | Run `pytest tests/unit`. Coverage includes schema validation, CSV policy, safe errors, logging field safety, strict threshold behavior, and job claims. |
| Database Migration Strategy | Remediated | `backend/app/migrations.py` defines the controlled `0001_initial_schema` baseline revision, records it in `schema_migration`, and runs only through the explicit deployment command `python -m app.migrations`. The API entry point does not create schemas at runtime. Migration application and idempotent re-runs emit safe `schema_migration_applied` or `schema_migration_skipped` events. | Run `python -m app.migrations` twice against an approved non-production Neon PostgreSQL database. Confirm a single `0001_initial_schema` record and inspect the safe migration event. |
| Development Readiness / Configuration Safety | Remediated | `backend/.env.example` uses a non-secret Neon PostgreSQL URL placeholder (`<NEON_USER>`, `<NEON_PASSWORD>`, `<NEON_HOST>`, and `<NEON_DATABASE>`), while `backend/app/core.py` requires `DATABASE_URL` from the runtime environment and never logs it. | Confirm deployment injects the approved Neon `DATABASE_URL` securely and that JSON log records never include it. |

## Additional Remediated Behavior Evidence

- The 28-day preceding-day baseline excludes the evaluated day and flags anomalies
  only when the deviation is strictly greater than the configured threshold.
- CSV validation rejects absent required headers, invalid readings, negative kWh,
  empty datasets, and timestamps without a timezone before readings are persisted.
- `ERROR_MAPPINGS` provides a single, inspectable mapping for validation,
  persistence, and unexpected errors; centralized handlers prevent their
  request, database, and exception diagnostics from reaching callers.
- The worker records attempts, locks queued work, rolls back failed work,
  classifies safe terminal failure states, and emits correlation-aware events.
- Benchmark and PDF generation remain explicitly fail-closed pending approval of
  peer-governance, report-template, and protected-storage integrations.

## Verification Commands

```bash
cd backend
pytest tests/unit
# DATABASE_URL must be securely injected by the verification runtime.
python -m app.migrations
```

The migration command requires a securely injected, approved non-production Neon
PostgreSQL `DATABASE_URL`. The example file is documentation only and must never
be used as a source of live credentials.

## Neon PostgreSQL-Backed Verification Execution (Current Runtime)

### Runtime configuration status

| Check | Result | Retained evidence |
| --- | --- | --- |
| `backend/.env.example` inspection | **Remediated**: the file contains only a parameterized Neon placeholder, not a usable credential. | The committed example cannot authenticate to Neon and explicitly directs operators to use deployment-injected configuration. |
| Neon runtime credential availability | **Blocked in this runtime**: no approved non-production runtime `DATABASE_URL` was injected for this verification session. | No Neon connection, migration, or PostgreSQL-backed tests were attempted with the example value. |
| Missing-configuration migration guard | **Verified previously**: `python -m app.migrations` without `DATABASE_URL` raises `RuntimeError: DATABASE_URL must be provided by the deployment environment.` | The migration runner fails closed and does not select a local or implicit database target. |

### Required secure Neon verification procedure

Inject an approved non-production Neon connection value through the verification
runtime or deployment secret manager; do not copy it into `.env.example`, shell
history, test output, or this evidence document. With that runtime-only value
available, execute:

```bash
cd backend
test -n "${DATABASE_URL:-}" || { echo "DATABASE_URL must be injected at runtime" >&2; exit 1; }
pytest tests/unit
python -m app.migrations
python -m app.migrations
```

### Stage 4 PostgreSQL evidence status

PostgreSQL-backed migration, repository, route, and worker verification is
**not yet complete**. To close this evidence gap, an approved non-production
Neon `DATABASE_URL` must be injected only into the verification runtime and the
migration command run twice. The repeat run must show one
`0001_initial_schema` record in `schema_migration` and safe
`schema_migration_applied` then `schema_migration_skipped` events. PostgreSQL
integration tests must additionally cover authorization boundaries, durable job
claiming with `FOR UPDATE SKIP LOCKED`, upload processing, export lifecycle,
audit records, and cross-process correlation-aware structured logs.

### Latest Neon verification attempt

The current verification runtime was invoked with an explicit non-secret
`DATABASE_URL` presence guard before attempting migrations, PostgreSQL schema
checks, or the unit suite. The first shell attempt was stopped by a
runtime-wrapper incompatibility with Bash `set -u` (`bash: $!: unbound
variable`), so it did not reach application code. The adjusted retry omitted
that shell option, reached the intended guard, and reported:

```text
BLOCKED: DATABASE_URL was not injected into this runtime.
```

No Neon connection was attempted, no example or local connection value was
substituted, and no credential was printed, retained, or written to repository
files. Consequently, this run executed zero application tests and could not
produce migration-application, idempotency, `schema_migration`, or PostgreSQL
table evidence. Runtime injection of an approved non-production Neon URL
remains the sole blocker for the required verification sequence.

### Follow-up Neon verification attempt after service submission

After PostgreSQL service configuration was submitted, the verification runtime
again ran a presence guard before either migration pass, schema inspection, or
the unit suite. The spawned process reported:

```text
BLOCKED: DATABASE_URL is not injected.
```

Therefore, zero migrations and zero test cases were executed in this attempt.
No fallback URL was used and no credential was printed or persisted. The
remaining blocker is runtime configuration propagation to the verification
subprocess, rather than migration or application-test behavior.

### Latest runtime-only Neon verification retry

The requested retry used only a credential-free presence guard and the
runtime-injected environment; it did not read or substitute a URL from
`.env.example`, a local file, or test configuration. Both controlled migration
commands stopped before application code or a Neon connection because the
launched subprocess still reported:

```text
BLOCKED: DATABASE_URL is not injected.
```

Consequently, neither migration pass applied or skipped a revision, and no
`schema_migration` row, PostgreSQL table, index, or constraint could be
inspected. Idempotency is therefore unverified rather than failed.

The backend suite was also run as `CI=1 PYTHONPATH=. pytest -q tests/unit`.
Both unit-test modules failed during collection when importing `app.services`
eagerly imported `app.core`, which requires `DATABASE_URL`. Pytest reported two
collection errors in 0.92 seconds, so zero test cases ran. Separately, static
inspection confirms the strict-threshold test must replace
`assert exact_deviation > threshold is False` with
`assert not (exact_deviation > threshold)` before the next passing run.

## Remaining Gate Preconditions

## Local `.env` Neon Verification Retry

The local untracked `backend/.env` was parsed and loaded only into a controlled
verification child process. The `DATABASE_URL` presence was confirmed without
printing, copying, or persisting its value. Both `python -m app.migrations`
passes completed successfully and emitted the safe
`schema_migration_skipped` event with outcome `already_applied` for
`0001_initial_schema`. A database inspection confirmed exactly one recorded
`0001_initial_schema` revision and the expected core tables
(`schema_migration`, `customer`, `site`, `user_account`, `processing_job`, and
`audit_event`).

The backend suite then ran as `CI=1 python -m pytest -q tests/unit`: 10 tests
passed and one test failed in 0.96 seconds. The failure is confined to
`test_strict_anomaly_threshold_boundary_is_documented`, whose expression
`assert exact_deviation > threshold is False` is an invalid chained-comparison
assertion for the intended condition. Replace it with
`assert not (exact_deviation > threshold)` and rerun the suite. Thus Neon
migration, schema, and idempotency verification are now complete; the
remaining immediate blocker is this test-code correction and an all-green
backend suite rerun.

### Successful backend unit-suite rerun

After the strict-threshold assertion was corrected, the two unit-test modules
were rerun with the local untracked `backend/.env` read only by a controlled
verification child process. The runner parsed and injected only
`DATABASE_URL`; it did not evaluate the dotenv file, print the connection
value, or persist it in repository files or this evidence artifact.

```text
11 passed in 0.90s
```

All eleven tests passed with zero failures and zero skips. This closes the
previous unit-test collection and strict-threshold assertion blocker for the
secure local verification path. PostgreSQL integration, authorization, route,
worker-flow, and cross-process correlation checks remain required gate
evidence.

The implemented remediation closes the stated repository-boundary, structured
logging, unit-test-foundation, centralized-error, migration, and configuration
safety gaps. A GO decision requires the repeat gate to execute the unit suite,
inspect representative structured logs, apply the migration to Neon PostgreSQL,
and verify authorized and unauthorized route and worker flows with
representative test data.

## Remaining Neon PostgreSQL Verification Execution

The local untracked `backend/.env` was parsed by Python in each controlled
verification child process. Only `DATABASE_URL` was injected into the child
application environment; its value was never printed, copied, logged, or
persisted in this artifact.

| Verification | Result | Sanitized evidence |
| --- | --- | --- |
| Controlled migrations and schema | **Passed** | Two migration invocations each emitted the safe `schema_migration_skipped` event for `0001_initial_schema`; inspection confirmed exactly one revision row and the expected core tables. |
| Terminal worker failure | **Passed** | A synthetic ingestion job beginning at attempt two was claimed, reached attempt three, and persisted `failed` with `failure_category=retry_exhausted`. Safe worker events retained the job correlation identifier. |
| Existing backend unit suite | **Passed** | `CI=1` execution of `tests/unit` completed with `11 passed in 0.97s`. |
| Protected route, authorization, upload, export, audit, and manager-flow probe | **Blocked before those behaviors** | The first protected request correctly returned `503` because the loaded local environment has `FEATURE_ENERSIGHT_ENABLED` disabled. The route did not proceed to authorization, repository, upload, export, audit, or worker assertions. The safe request record included the supplied correlation identifier and no secret values. |

This execution confirms Neon migration idempotency, schema availability, the
current unit suite, and terminal worker-failure classification. It does **not**
establish the remaining protected-route and authorization-flow evidence,
because `require_enabled()` intentionally blocks product operations before
those paths execute. This is a configuration-gate limitation, not evidence of
an authorization or repository failure.

To close the remaining Stage 4 gate evidence, rerun the synthetic
PostgreSQL-backed route probe with the same approved Neon `DATABASE_URL` and
an approved **verification-process-only** `FEATURE_ENERSIGHT_ENABLED=true`
override. The rerun must cover allowed access, cross-customer denial, upload
processing, audit/correlation persistence, export reauthorization, and
manager-portfolio isolation. Do not persist that enabled value in `.env`,
`.env.example`, test output, or this evidence file.

## Controlled Feature-Enabled Verification (Sanitized)

A controlled child verification process temporarily enabled the product feature
without changing repository configuration. A protected benchmark request then
returned `401 authentication_required` rather than the prior feature-disabled
response, confirming that request processing reached authentication.

The Neon-backed synthetic workflow then verified authorized upload queueing and
ingestion-worker completion. Safe queue, worker-claim, and worker-completion
events retained the verification correlation identifier, and cleanup removed
the synthetic verification records afterward.

The export portion did not complete because `create_export` in
`backend/app/services.py` constructs `ExportRequest` without importing that
model. The resulting `NameError` occurred before export persistence, export
audit evidence, export-worker completion, reauthorization, download, and
manager-portfolio checks could run. This is a production-code blocker, not a
Neon connectivity or feature-gate failure. The next verification pass must add
`ExportRequest` to the models imported by `backend/app/services.py`, add a
regression test, and rerun the remaining synthetic authorization and export
workflow checks using process-scoped configuration only.

## Post-Export-Fix Verification Retry (Sanitized)

After the missing `ExportRequest` import was corrected and regression coverage
was added, the backend test suite was executed in CI mode. The local untracked
dotenv file was parsed only to provide `DATABASE_URL` to the verification child
process, and `FEATURE_ENERSIGHT_ENABLED=true` was supplied only to that child
process. Neither value was written to repository configuration, test output,
or this artifact.

```text
12 passed in 0.94s
```

The export-service regression and all existing unit coverage therefore pass
under the requested feature-enabled verification configuration. No test failed
and no test was skipped.

The remaining Neon-backed protected-route workflow probe could not be launched
in this runtime because its self-cleaning synthetic-data command exceeded the
shell tool's 3,000-character command limit twice; both launches were rejected
before any application code, database query, request, or cleanup action ran.
This is a verification-harness limitation, not an observed application defect.
The outstanding probe must still prove unauthenticated behavior, cross-customer
denial, manager-portfolio isolation, export queue-to-worker completion,
download reauthorization, and persisted audit/job correlation using a supported
script or integration-test harness. Retain only sanitized aggregate evidence
and remove all synthetic verification records after that run.

## Final Opt-In Neon Workflow Verification (Sanitized)

The dedicated self-cleaning Neon integration harness was executed in CI mode
with `DATABASE_URL` parsed without shell evaluation from the local untracked
dotenv file and passed only to the child pytest process. The opt-in integration
and feature-enabled flags were also process-scoped; no credential or override
was printed, copied, or persisted.

```text
1 passed, 1 warning in 11.16s
```

The single workflow scenario passed, establishing the previously outstanding
Neon-backed evidence for unauthenticated handling, cross-customer denial,
manager-portfolio isolation, upload and export queue-to-worker completion,
download reauthorization, audit/job correlation, and namespaced fixture
cleanup. The only observation was a non-blocking `PytestUnknownMarkWarning`
for the unregistered `integration` marker. Register that marker in pytest
configuration to remove the warning; it does not affect verification status.
