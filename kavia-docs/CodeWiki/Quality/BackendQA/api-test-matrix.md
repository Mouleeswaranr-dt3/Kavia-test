# EnerSight Stage 5 API Test Matrix

[CodeWiki](../../index.md) / [Quality](../index.md) / [Backend QA](index.md)

## Test Conventions

All requests target the implemented `/api/v1` route prefix. Preconditions use synthetic, namespaced PostgreSQL fixtures and process-scoped feature enablement. Status codes marked as `200` describe successful retrieval or an explicit successful domain state; `202` describes accepted asynchronous work; `401`, `403`, `404`, `422`, and `503` must use the safe error envelope where applicable. Where the current contract returns a documented unavailable or fail-closed state rather than a conventional error, the expected result is authoritative.

Each case is mapped to an acceptance criterion in the approved feature specification through the traceability table below. The matrix also specifies the response-contract assertions that must accompany the stated result and status. The documented cases are not execution results; the execution-evidence register remains unpopulated until the Stage 5 suite is run.

## Meter Upload APIs

| Test ID | FR | Scenario | Preconditions | Steps | Expected result | Expected status |
| --- | --- | --- | --- | --- | --- | --- |
| API-001 | FR-1 | Positive valid CSV upload | Authorized user has site access; valid timezone-aware CSV. | POST `/meter-uploads` with site metadata and CSV. | Upload provenance and a correlated durable ingestion job are created with `queued` state. | 202 |
| API-002 | FR-1 | Negative unauthorized site upload | Authenticated user lacks target-site access. | POST a valid CSV for another customer site. | Request is denied without upload, reading, or job disclosure. | 403 |
| API-003 | FR-1 | Boundary invalid CSV content | Authorized user; CSV lacks a required header or contains a timezone-less timestamp. | POST the invalid CSV and inspect status after validation. | Upload is rejected with safe validation findings; no accepted readings or downstream work exist. | 422 |
| API-004 | FR-1 | Positive upload-status retrieval | Authorized uploader has an existing queued, processing, completed, or rejected upload. | GET `/meter-uploads/{upload_id}`. | Response exposes only authorized provenance, safe validation summary, and lifecycle state. | 200 |
| API-005 | FR-1 | Negative cross-tenant upload-status retrieval | User lacks access to the upload site. | GET another tenant's upload ID. | Response does not disclose protected upload details. | 403 or 404 |
| API-006 | FR-1 | Boundary nonexistent upload ID | Authorized user; syntactically valid unknown ID. | GET `/meter-uploads/{upload_id}`. | Safe not-found response is returned. | 404 |

## Site Consumption and Analytics APIs

| Test ID | FR | Scenario | Preconditions | Steps | Expected result | Expected status |
| --- | --- | --- | --- | --- | --- | --- |
| API-007 | FR-2 | Positive daily consumption | Authorized user; accepted readings exist in range. | GET `/sites/{site_id}/consumption` with `daily` granularity. | Daily periods, selected range, and `available` state are returned. | 200 |
| API-008 | FR-2 | Negative cross-customer consumption | User lacks site access. | Request consumption for another customer's site. | Access is denied without values or site details. | 403 or 404 |
| API-009 | FR-2 | Boundary range and granularity validation | Authorized user. | Request reversed dates and then an unsupported granularity. | Each request returns field-safe validation errors and no aggregation. | 422 |
| API-010 | FR-2 | Positive weekly and monthly aggregation | Authorized user; accepted data spans multiple periods. | Request `weekly`, then `monthly` for the same range. | Correctly labeled selected aggregation and range are returned. | 200 |
| API-011 | FR-2 | Negative unauthenticated consumption | No credentials. | GET consumption for a valid site ID. | Authentication is required before resource information is exposed. | 401 |
| API-012 | FR-2 | Boundary no-data range | Authorized user; site has no accepted data in requested range. | GET consumption for empty range. | Explicit `no_data` state is returned; no zero-valued data is implied. | 200 |
| API-013 | FR-3, FR-4 | Positive daily analytics | Authorized user; 28 preceding daily values and an evaluated day exist. | GET `/sites/{site_id}/daily-analytics`. | Actual values, valid baseline, deviation, threshold, and anomaly state are returned. | 200 |
| API-014 | FR-3 | Negative unauthorized daily analytics | User lacks site access. | GET daily analytics for another tenant site. | Access is denied safely. | 403 or 404 |
| API-015 | FR-3, FR-4 | Boundary baseline and strict threshold | Authorized user; one date lacks sufficient history and another equals the threshold exactly. | GET daily analytics for both dates. | First result is `baseline_unavailable`; exact-threshold result is not anomalous. | 200 |

## Benchmark and Account Manager APIs

| Test ID | FR | Scenario | Preconditions | Steps | Expected result | Expected status |
| --- | --- | --- | --- | --- | --- | --- |
| API-016 | FR-6 | Positive governed benchmark | Authorized user; approved peer adapter returns eligible aggregate. | GET `/sites/{site_id}/benchmark`. | Available aggregate and relative comparison are returned without peer identities. | 200 |
| API-017 | FR-6 | Negative unauthorized benchmark | User lacks site access. | GET benchmark for another tenant site. | Access is denied without benchmark or peer information. | 403 or 404 |
| API-018 | FR-6 | Boundary benchmark unavailable | Authorized user; peer provider or cohort eligibility is unavailable. | GET benchmark. | Explicit safe `unavailable` state and reason code are returned; no inferred average appears. | 200 |
| API-019 | FR-5 | Positive assigned-manager alerts | Manager has alerts for assigned customers. | GET `/account-manager/alerts`. | Only assigned-customer alerts include customer, site, date, deviation, and suggested action. | 200 |
| API-020 | FR-5 | Negative customer-role alerts request | Authenticated customer user is not an account manager. | GET `/account-manager/alerts`. | Role or authorization denial is safe. | 403 |
| API-021 | FR-5 | Boundary empty manager portfolio | Manager has no assignments or qualifying alerts. | GET alerts. | Explicit empty result is returned without unrelated alerts. | 200 |
| API-022 | FR-7 | Positive anomaly-count ranking | Manager has assigned customers with varying anomaly counts. | GET `/account-manager/customer-ranking` for anomaly-count criterion. | Assigned customers are ordered descending and the active criterion and period are identified. | 200 |
| API-023 | FR-7 | Negative invalid ranking criterion | Authenticated manager. | Request an unsupported criterion. | Request validation returns safe field details. | 422 |
| API-024 | FR-7 | Boundary severity ties or no-data | Manager has tied severity values or no qualifying data. | Request severity ranking. | Contract-defined deterministic ordering or explicit empty/no-data state is returned, with no unassigned customer. | 200 |

## Export APIs

| Test ID | FR | Scenario | Preconditions | Steps | Expected result | Expected status |
| --- | --- | --- | --- | --- | --- | --- |
| API-025 | FR-8 | Positive CSV export creation | Authorized user; selected site has accepted data. | POST `/exports` for a valid range and CSV. | Export request, correlated job, and `queued` lifecycle state are created. | 202 |
| API-026 | FR-8 | Negative unauthorized export creation | User lacks selected site access. | POST export for another customer site. | Export is denied and no protected report data or job is exposed. | 403 |
| API-027 | FR-8 | Boundary export request validation | Authorized user. | POST with reversed dates, unsupported format, and then a no-data range. | Invalid values return 422; no-data returns the approved no-exportable-data result without misleading file creation. | 422 or 200 |
| API-028 | FR-8 | Positive export lifecycle retrieval | Authorized requester has queued, processing, completed, or failed export. | GET `/exports/{export_id}`. | Safe lifecycle status, expiry metadata, and failure category where applicable are returned. | 200 |
| API-029 | FR-8 | Negative cross-user export retrieval | Another authenticated user lacks export access. | GET another user's export ID. | Access is denied without status, locator, or report metadata. | 403 or 404 |
| API-030 | FR-8 | Boundary unknown export ID | Authorized requester; unknown valid identifier. | GET `/exports/{export_id}`. | Safe not-found response is returned. | 404 |
| API-031 | FR-8 | Positive completed export download | Authorized requester; CSV export is complete and unexpired. | GET `/exports/{export_id}/download`. | Download is reauthorized and only the completed authorized report is streamed. | 200 |
| API-032 | FR-8 | Negative revoked-access download | Export is complete, but requester access was revoked after creation. | GET download endpoint after revocation. | Reauthorization denies access and does not issue a signed URL or file. | 403 or 404 |
| API-033 | FR-8 | Boundary incomplete or expired download | Authorized requester; export is queued, failed, or expired. | GET download endpoint. | No file is returned; response communicates the safe lifecycle or expiry outcome. | 409 or 404 |

## Execution Notes

The matrix requires both API-level assertions and persistence assertions for destructive flows. Upload rejection cases must verify the absence of accepted readings, analytics, alerts, and downstream jobs. Export download cases must verify that internal storage locators and signed URLs are never returned in the status payload or logs. PDF export remains a fail-closed case until protected storage and report-template prerequisites are implemented and approved.

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
| API-016, API-018 | FR-6 AC-1, AC-2, and AC-3 | These cases cover available governed aggregates and the mandatory unavailable state without peer disclosure. |
| API-017 | FR-6 security boundary | This case ensures that a user cannot discover benchmark data for another customer site. |
| API-019, API-021 | FR-5 AC-1 and AC-3 | These cases verify assigned-manager alert visibility and the absence of unrelated alerts in an empty portfolio. |
| API-020 | FR-5 security boundary | This case verifies that a non-manager cannot retrieve manager-only alerts. |
| API-022, API-024 | FR-7 AC-1, AC-2, AC-3, and AC-4 | These cases verify assignment-only ranking, supported ordering, criterion identification, and defined empty or tie behavior. |
| API-023 | FR-7 AC-4 and input-contract boundary | This case verifies safe rejection of an unsupported ranking criterion. |
| API-025, API-028, API-031 | FR-8 AC-1 | These cases verify the authorized CSV export request, lifecycle, and completed authorized download path. |
| API-026, API-029, API-032 | FR-8 AC-3 | These cases verify export and download denial when authorization is absent or revoked. |
| API-027, API-030, API-033 | FR-8 AC-4 and lifecycle boundary | These cases verify safe invalid, no-data, unknown, incomplete, and expired outcomes without misleading file creation. |

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
