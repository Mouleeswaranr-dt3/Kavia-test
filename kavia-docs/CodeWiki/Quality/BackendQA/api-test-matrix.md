[CodeWiki](../../index.md) / [Quality](../index.md) / [Backend QA](index.md)

# EnerSight Stage 5 API Test Matrix

## Test Conventions

All requests target the implemented `/api/v1` route prefix. Preconditions use synthetic, namespaced PostgreSQL fixtures and process-scoped feature enablement. The current implementation returns `200` for successful upload and export creation even though it queues durable asynchronous work. It uses `404 resource_unavailable` for protected-resource denials so an unauthorized caller cannot determine whether a resource exists. The `401`, `404`, `422`, and `503` outcomes must use the safe error envelope where applicable. Where the current contract returns a documented unavailable or fail-closed state rather than a conventional error, the expected result is authoritative.

Each case is mapped to an acceptance criterion in the approved feature specification through the traceability table below. The matrix also specifies the response-contract assertions that must accompany the stated result and status. The documented cases are not execution results; the execution-evidence register remains unpopulated until the Stage 5 suite is run.

## Meter Upload APIs

| Test ID | FR | Scenario | Preconditions | Steps | Expected result | Expected status |
| --- | --- | --- | --- | --- | --- | --- |
| API-001 | FR-1 | Positive valid CSV upload | Authorized operations user has site access; valid timezone-aware CSV. | POST `/meter-uploads` with site metadata and CSV. | Upload provenance and a correlated durable ingestion job are created with `queued` state. | 200 |
| API-002 | FR-1 | Negative unauthorized site upload | Authenticated user lacks target-site access or is not an operations user. | POST a valid CSV for another customer site. | Request is denied without upload, reading, or job disclosure. | 404 |
| API-003 | FR-1 | Boundary invalid CSV content | Authorized operations user; either a non-CSV filename or CSV content lacking a required header or containing a timezone-less timestamp. | POST a non-CSV filename and separately POST invalid CSV contents; invoke the worker for the latter. | A non-CSV filename is synchronously rejected. Invalid CSV contents are initially queued, then become `rejected` with a safe validation summary after worker processing; neither path creates accepted readings or downstream derived records. | 422 for non-CSV; 200 then worker rejection for invalid CSV |
| API-004 | FR-1 | Positive upload-status retrieval | Authorized uploader has an existing queued, processing, completed, or rejected upload. | GET `/meter-uploads/{upload_id}`. | Response exposes only authorized provenance, safe validation summary, and lifecycle state. | 200 |
| API-005 | FR-1 | Negative cross-tenant upload-status retrieval | User lacks access to the upload site. | GET another tenant's upload ID. | Response does not disclose protected upload details. | 404 |
| API-006 | FR-1 | Boundary nonexistent upload ID | Authorized user; syntactically valid unknown ID. | GET `/meter-uploads/{upload_id}`. | Safe not-found response is returned. | 404 |

## Site Consumption and Analytics APIs

| Test ID | FR | Scenario | Preconditions | Steps | Expected result | Expected status |
| --- | --- | --- | --- | --- | --- | --- |
| API-007 | FR-2 | Positive daily consumption | Authorized user; accepted readings exist in range. | GET `/sites/{site_id}/consumption` with `daily` granularity. | Daily periods, selected range, and `available` state are returned. | 200 |
| API-008 | FR-2 | Negative cross-customer consumption | User lacks site access. | Request consumption for another customer's site. | Access is denied without values or site details. | 404 |
| API-009 | FR-2 | Boundary range and granularity validation | Authorized user. | Request reversed dates and then an unsupported granularity. | Each request returns field-safe validation errors and no aggregation. | 422 |
| API-010 | FR-2 | Positive weekly and monthly aggregation | Authorized user; accepted data spans multiple periods. | Request `weekly`, then `monthly` for the same range. | Correctly labeled selected aggregation and range are returned. | 200 |
| API-011 | FR-2 | Negative unauthenticated consumption | No credentials. | GET consumption for a valid site ID. | Authentication is required before resource information is exposed. | 401 |
| API-012 | FR-2 | Boundary no-data range | Authorized user; site has no accepted data in requested range. | GET consumption for empty range. | Explicit `no_data` state is returned; no zero-valued data is implied. | 200 |
| API-013 | FR-3, FR-4 | Positive daily analytics | Authorized user; 28 preceding daily values and an evaluated day exist. | GET `/sites/{site_id}/daily-analytics`. | Actual values, valid baseline, deviation, threshold, and anomaly state are returned. | 200 |
| API-014 | FR-3 | Negative unauthorized daily analytics | User lacks site access. | GET daily analytics for another tenant site. | Access is denied safely. | 404 |
| API-015 | FR-3, FR-4 | Boundary baseline and strict threshold | Authorized user; one date lacks sufficient history and another equals the threshold exactly. | GET daily analytics for both dates. | First result is `baseline_unavailable`; exact-threshold result is not anomalous. | 200 |

## Benchmark and Account Manager APIs

| Test ID | FR | Scenario | Preconditions | Steps | Expected result | Expected status |
| --- | --- | --- | --- | --- | --- | --- |
| API-016 | FR-6 | Governed benchmark available capability | Authorized user; approved peer adapter returns eligible aggregate. | GET `/sites/{site_id}/benchmark`. | Not executable against the current backend: no peer adapter exists and the route always returns the unavailable state. This case is blocked from the current GO gate until that capability is implemented and approved. | Blocked |
| API-017 | FR-6 | Negative unauthorized benchmark | User lacks site access. | GET benchmark for another tenant site. | Access is denied without benchmark or peer information. | 404 |
| API-018 | FR-6 | Boundary benchmark unavailable | Authorized user; peer provider or cohort eligibility is unavailable. | GET benchmark. | Explicit safe `unavailable` state and reason code are returned; no inferred average appears. | 200 |
| API-019 | FR-5 | Positive assigned-manager alerts | Manager has alerts for assigned customers. | GET `/account-manager/alerts`. | Only assigned-customer alerts include customer, site, date, deviation, and suggested action. | 200 |
| API-020 | FR-5 | Negative customer-role alerts request | Authenticated customer user is not an account manager. | GET `/account-manager/alerts`. | Role or authorization denial is safe. | 404 |
| API-021 | FR-5 | Boundary empty manager portfolio | Manager has no assignments or qualifying alerts. | GET alerts. | Explicit empty result is returned without unrelated alerts. | 200 |
| API-022 | FR-7 | Positive anomaly-count ranking | Manager has assigned customers with varying anomaly counts. | GET `/account-manager/customer-ranking` for anomaly-count criterion. | Assigned customers are ordered descending and the active criterion and period are identified. | 200 |
| API-023 | FR-7 | Negative invalid ranking criterion | Authenticated manager. | Request an unsupported criterion. | Request validation returns safe field details. | 422 |
| API-024 | FR-7 | Boundary unsupported severity ranking | Authenticated manager. | Request `criterion=severity`. | `severity` is not a supported `RankingCriterion`; safe request validation rejects it. Anomaly-count ties and no-data behavior remain covered under API-022. | 422 |

## Export APIs

| Test ID | FR | Scenario | Preconditions | Steps | Expected result | Expected status |
| --- | --- | --- | --- | --- | --- | --- |
| API-025 | FR-8 | Positive CSV export creation | Authorized user; selected site has accepted data. | POST `/exports` for a valid range and CSV. | Export request, correlated job, and `queued` lifecycle state are created. | 200 |
| API-026 | FR-8 | Negative unauthorized export creation | User lacks selected site access. | POST export for another customer site. | Export is denied and no protected report data or job is exposed. | 404 |
| API-027 | FR-8 | Boundary export request validation and no-data defect probe | Authorized user. | POST with reversed dates, unsupported format, and then a no-data range; process the no-data CSV job. | Invalid values return `422`. The current implementation queues and completes an empty CSV export for a no-data range. Record that observed behavior as a blocking data-integrity defect; it is not a passing no-data contract. | 422 for invalid values; 200 then defect probe for no-data |
| API-028 | FR-8 | Positive export lifecycle retrieval | Authorized requester has queued, processing, completed, or failed export. | GET `/exports/{export_id}`. | Safe lifecycle status, expiry metadata, and failure category where applicable are returned. | 200 |
| API-029 | FR-8 | Negative cross-user export retrieval | Another authenticated user lacks export access. | GET another user's export ID. | Access is denied without status, locator, or report metadata. | 404 |
| API-030 | FR-8 | Boundary unknown export ID | Authorized requester; unknown valid identifier. | GET `/exports/{export_id}`. | Safe not-found response is returned. | 404 |
| API-031 | FR-8 | Positive completed export download | Authorized requester; CSV export is complete and unexpired. | GET `/exports/{export_id}/download`. | Download is reauthorized and only the completed authorized report is streamed. | 200 |
| API-032 | FR-8 | Negative revoked-access download | Export is complete, but requester access was revoked after creation. | GET download endpoint after revocation. | Reauthorization denies access and does not issue a signed URL or file. | 404 |
| API-033 | FR-8 | Boundary incomplete or expired download defect probe | Authorized requester; export is queued, failed, or expired. | GET download endpoint. | Queued or failed exports safely return `404`. Current code does not evaluate `expires_at`, so an expired completed CSV remains downloadable. Record expiry behavior as a blocking defect until expiration is enforced. | 404 for incomplete; defect probe for expired completed CSV |

## Execution Notes

The matrix requires both API-level assertions and persistence assertions for destructive flows. Upload rejection cases must verify the absence of accepted readings, analytics, alerts, and downstream derived records; the durable ingestion job is expected because invalid CSV validation occurs in the worker. Export download cases must verify that internal storage locators and signed URLs are never returned in the status payload or logs. PDF export remains a fail-closed case until protected storage and report-template prerequisites are implemented and approved.

## Reconciliation Decisions and Blocking Defect Probes

This baseline is source-verified against `backend/app/main.py`, `backend/app/schemas.py`, `backend/app/services.py`, and `backend/app/worker.py` on 2026-09-09. The asynchronous creation routes do not declare FastAPI creation status codes, so API-001 and API-025 expect `200`. The shared authorization policy deliberately conceals protected resource existence through `404 resource_unavailable`, so API-002, API-005, API-008, API-014, API-017, API-020, API-026, API-029, and API-032 expect `404`.

API-016 is blocked rather than failed: `get_benchmark` always emits `state: unavailable` with `reason_code: peer_governance_not_configured`, and no available benchmark path exists. API-024 uses `422` because the `RankingCriterion` enum exposes only `anomaly_count`. API-027 and API-033 are mandatory defect probes. `create_export` does not reject a no-data range and the CSV worker completes it, while `download_export` does not inspect `ExportRequest.expires_at`. Each observed probe failure must be entered in the Stage 5 defect register using `backend-defect-log-template.md`; neither may count toward a GO result before remediation and retest.

## Acceptance-Criteria Traceability

| Matrix cases | Acceptance-criteria mapping | Traceability rationale |
| --- | --- | --- |
| API-001, API-004 | FR-1 AC-1 | These cases verify creation and observable lifecycle status for an authorized site upload that can become a usable dataset. |
| API-002, API-005, API-006 | FR-1 AC-1 and security boundary | These cases verify that only an authorized user can initiate or inspect the upload lifecycle; unknown and inaccessible resources must not disclose protected information. |
| API-003 | FR-1 AC-2 and AC-3 | This case verifies rejection for missing required columns and invalid timestamp data, including the absence of usable downstream data. |
| API-007, API-010, API-012 | FR-2 AC-1, AC-2, AC-3, and AC-4 | These cases cover daily, weekly, monthly, same-range retrieval, and explicit no-data behavior. |
| API-008, API-009, API-011 | FR-2 security boundary and AC-1 through AC-4 | These cases ensure that aggregation behavior cannot be reached without valid, authorized input. |
| API-013, API-015 | FR-3 AC-1 through AC-3 and FR-4 AC-1, AC-2, AC-3, and AC-5 | These cases cover a 28-day preceding baseline, baseline availability, strict threshold handling, non-anomalous equality, and the no-valid-baseline condition. |
| API-014 | FR-3 and FR-4 security boundary | This case protects analytic data from cross-tenant access. |
| API-016, API-018 | FR-6 AC-1, AC-2, and AC-3 | API-016 is blocked pending a peer adapter; API-018 verifies the implemented mandatory unavailable state without peer disclosure. |
| API-017 | FR-6 security boundary | This case ensures that a user cannot discover benchmark data for another customer site. |
| API-019, API-021 | FR-5 AC-1 and AC-3 | These cases verify assigned-manager alert visibility and the absence of unrelated alerts in an empty portfolio. |
| API-020 | FR-5 security boundary | This case verifies that a non-manager cannot retrieve manager-only alerts. |
| API-022, API-024 | FR-7 AC-1, AC-2, AC-3, and AC-4 | API-022 verifies assignment-only anomaly-count ordering and no-data behavior. API-024 verifies the safe validation boundary for the unsupported severity criterion. |
| API-023 | FR-7 AC-4 and input-contract boundary | This case verifies safe rejection of an unsupported ranking criterion. |
| API-025, API-028, API-031 | FR-8 AC-1 | These cases verify the authorized CSV export request, lifecycle, and completed authorized download path. |
| API-026, API-029, API-032 | FR-8 AC-3 | These cases verify export and download denial when authorization is absent or revoked. |
| API-027, API-030, API-033 | FR-8 AC-4 and lifecycle boundary | API-030 verifies an unknown-resource safe outcome. API-027 and API-033 probe unresolved no-data-export and expiry defects, which must be remediated and retested before they can satisfy the lifecycle boundary. |

The specification's FR-4 AC-4 requires frontend chart highlighting and is outside the backend API scope. Stage 5 validates the API-visible anomaly flag and data needed for the frontend to render that state, but Stage 6 UI testing remains responsible for proving visual distinguishability. The specification's FR-5 AC-2 requires UI navigation and is similarly outside the backend API scope; the backend evidence is restricted to authorized alert context.

## Response-Contract Assertion Baseline

| Contract area | Required assertions for each applicable execution |
| --- | --- |
| Safe errors | Verify `code`, user-safe `message`, and `correlation_id`; verify field-safe `details` only where validation applies; verify the absence of stack traces, provider diagnostics, tokens, and persistence details. |
| Uploads | Verify the public upload identifier, lifecycle state, safe validation summary, and provenance fields permitted by the implemented contract; reject disclosure of source CSV payload or checksum-derived sensitive information. |
| Consumption | Verify `site_id`, selected date range, granularity, `available` or `no_data` state, and typed period values. A no-data response must not imply zero consumption. |
| Daily analytics | Verify actual values, nullable baseline and deviation fields, threshold, anomaly flag, and `available` or `baseline_unavailable` behavior. Equality with the threshold must return a non-anomalous result. |
| Benchmarks | Verify `site_id`, `available` or `unavailable` state, and safe reason code when unavailable. Verify that no peer identity, raw peer reading, or inferred average is exposed. |
| Alerts and rankings | Verify authorized customer and site context, active criterion or period where returned, ordered result shape, and an explicit empty result without unassigned-customer data. |
| Exports | Verify export identifier, lifecycle state, permitted expiry or failure metadata, and download availability. Verify that status responses never contain an internal storage locator or signed URL and that download reauthorization occurs at retrieval time. |

## Execution-Evidence Register

| Evidence item | Current status | Required record before Stage 5 completion |
| --- | --- | --- |
| Matrix-case results | Blocked / not run | The 2026-09-08 verification record shows that `/home/kavia/workspace/code-generation/backend` was inaccessible to the runtime; API-001 through API-033 therefore issued no HTTP requests and observed no application statuses. On rerun, retain a sanitized run identifier, environment/build, execution date, actual status, actual result, and pass, fail, blocked, or not-run disposition. |
| Response-contract assertions | Not executed | Retain automated assertion output or a sanitized contract-validation report for every endpoint and documented state. |
| Persistence and destructive-flow assertions | Not executed | Retain proof that rejected uploads leave no accepted readings, analytics, alerts, or downstream jobs and that export authorization prevents protected-data disclosure. |
| Concurrent-worker, retry, and recovery scenarios | Not executed | Retain PostgreSQL-backed evidence for claim contention, retry exhaustion, terminal state persistence, and recovery behavior. |
| Defect disposition | Not started | Link each failed case to a defect record and record verified retest evidence or an approved release disposition. |
