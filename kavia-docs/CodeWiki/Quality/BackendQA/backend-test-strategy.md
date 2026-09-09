# EnerSight Stage 5 Backend Test Strategy

[CodeWiki](../../index.md) / [Quality](../index.md) / [Backend QA](index.md)

## Purpose and Scope

This strategy defines how Stage 5 validates the EnerSight Analytics backend after the Stage 4 Go decision. The scope is the implemented `/api/v1` backend surface for uploads, site consumption and analytics, peer benchmarks, account-manager workflows, and exports. The strategy verifies correct outcomes, safe failure handling, authorization isolation, durable processing, and observability without treating normal no-data or unavailable states as server failures.

The strategy is based on the approved functional requirements and Stage 4 evidence. It is intentionally explicit about capabilities that remain fail-closed or dependent on external policy decisions. A test may validate that a capability is safely unavailable, but it must not represent an unavailable benchmark or disabled PDF export as a completed business feature.

## Quality Objectives

Stage 5 must demonstrate that authorized users can access only their permitted sites, customer data, alerts, and exports. It must demonstrate that invalid uploads cannot produce accepted readings or downstream analytics, that daily baseline and anomaly calculations honor the strict greater-than threshold rule, and that export download access is reauthorized.

The suite must also demonstrate that API errors are returned using safe envelopes, structured logs and audit events retain correlation identifiers without sensitive payloads, and asynchronous upload and export jobs reach valid terminal states. Normal states such as `no_data`, `baseline_unavailable`, `unavailable`, `queued`, and `completed` must remain distinguishable from internal failures.

## Test Levels

| Test level | Focus | Required evidence |
| --- | --- | --- |
| Unit | Pure validation, calculation, authorization-policy, and job-transition rules. | Deterministic tests for CSV validation, 28-day baseline, strict threshold, safe errors, and state transitions. |
| Repository integration | PostgreSQL mappings, constrained queries, indexes, transactions, and job claims. | PostgreSQL-backed tests using representative synthetic tenant data. |
| API integration | HTTP contract behavior, validation, authorization, response states, response schemas, and safe error envelopes. | Tests for every endpoint in the API matrix with authenticated and unauthorized principals, including acceptance-criteria and response-contract assertions. |
| Worker-flow integration | Durable upload and export job processing, retry classification, audit records, and correlation. | Self-cleaning worker-flow tests covering completion and terminal failure. |
| Contract and security | Identity, peer-data, and protected-storage boundaries. | Adapter tests or documented fail-closed evidence until a provider is selected. |
| Performance and resilience | Response behavior under representative volume, concurrent workers, and recoverable failures. | Approved budgets, measured results, and recovery evidence before production release. |

## Test Environment and Data

The repeatable API and repository suite must run against a non-production PostgreSQL environment. Test data must be synthetic, namespaced, and removed after execution. The minimum fixture set includes two customers, multiple sites, an authorized customer user, a cross-customer user, an assigned account manager, an unassigned account manager, valid and invalid CSV uploads, at least 29 days of daily history, an anomalous day, a no-data period, and completed and incomplete exports.

Feature enablement and database credentials must be injected only into the test process. Test logs, defect reports, fixtures, and published evidence must not contain database URLs, tokens, raw meter readings, signed URLs, protected storage locators, or real customer data.

## Entry and Exit Criteria

Stage 5 execution may begin because Stage 4 has a Go decision and passing targeted regression and protected-workflow evidence. Before a release candidate is accepted, all high-priority matrix cases must execute against the deployed API contract, no open critical or high-severity defects may remain, and all regression cases must pass.

Exit requires evidence for tenant and portfolio isolation, upload rejection and completion, consumption and analytics state handling, alert and ranking scoping, benchmark fail-closed behavior or governed-provider validation, export lifecycle and download reauthorization, safe errors, audit correlation, concurrent job-claim behavior, and approved performance targets. Policy-dependent functionality remains blocked until its governing decisions are approved and tested.

## Functional Requirement Traceability

| Functional requirement | Backend QA coverage |
| --- | --- |
| FR-1: Meter Reading Data Ingestion | Upload creation, upload status, valid CSV processing, required-header and invalid-value rejection, and no downstream records after rejection. |
| FR-2: Consumption Dashboard and Period Aggregation | Consumption retrieval for daily, weekly, and monthly granularity, range validation, authorized access, and explicit no-data outcomes. |
| FR-3: Rolling Four-Week Baseline | Daily analytics retrieval, exactly 28 preceding days, evaluated-day exclusion, and baseline-unavailable results. |
| FR-4: Anomaly Detection and Chart Highlighting | API-visible anomaly fields, strict threshold behavior, non-positive or unavailable baseline handling, and derived analytic integrity. |
| FR-5: Account Manager Alerts | Assigned-manager alert visibility, customer-site context, and portfolio isolation. |
| FR-6: Peer Benchmarking | Authorized benchmark retrieval, governed available data when integrated, and explicit unavailable behavior without peer disclosure. |
| FR-7: Account Manager Customer Ranking | Ranking by supported criterion, period and criterion identification, ordering, and assignment-only results. |
| FR-8: Consumption Report Export | Authorized request creation, lifecycle retrieval, no-exportable-data behavior, download reauthorization, CSV completion, and PDF fail-closed or enabled-path validation. |

## Acceptance-Criteria and Response-Contract Validation

The API Test Matrix maps each test to the applicable acceptance criterion in the approved feature specification as well as to FR-1 through FR-8. This mapping distinguishes a business outcome from a route-level implementation detail. Authorization denials, malformed identifiers, and unavailable dependency outcomes may support an acceptance criterion indirectly, but they must also be retained as independent security and contract tests because the feature specification does not enumerate every defensive behavior.

For every executed matrix case, automation or a sanitized execution record must verify the endpoint-specific response contract. Assertions must cover the expected HTTP status, required public fields, field types, permitted state values, nullable fields, and omission of protected information. A passing status code alone is insufficient. In particular, status responses must not contain raw CSV payloads, credentials, database URLs, internal storage locators, signed URLs, unredacted audit metadata, peer identities, or internal exception diagnostics.

The response-contract baseline is the implemented public API described in the current backend architecture documentation. Where the detailed design describes a future provider-enabled contract that is not implemented, Stage 5 must validate the actual safe unavailable or fail-closed response rather than asserting an unimplemented enabled-path response.

## Risks and Mitigations

The highest risks are unauthorized tenant or portfolio access, invalid data entering derived analytics, duplicate or concurrent job processing, protected export exposure, response-schema drift, and unsupported provider-backed features appearing available. Stage 5 mitigates these risks through PostgreSQL-backed authorization tests, destructive and boundary upload tests, concurrent worker-claim tests, download reauthorization tests, response-schema assertions, and explicit assertions that unavailable or disabled capabilities return safe states.

Several business policies remain unresolved, including CSV size and duplicate handling, partial-validity handling, baseline sufficiency, ranking-period definitions, peer-cohort governance, PDF templates, retention, and measurable service objectives. Tests must verify the current reject, unavailable, or fail-closed behavior and must be revised when an approved policy changes the contract.
