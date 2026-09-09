# EnerSight Stage 5 Backend Regression Test Strategy

[CodeWiki](../../index.md) / [Quality](../index.md) / [Backend QA](index.md)

## Objective

The regression strategy ensures that backend changes do not reintroduce defects already addressed during Stage 4 or break the Stage 5 API contract. It prioritizes authorization, ingestion integrity, analytics correctness, asynchronous lifecycle handling, export protection, and safe error and telemetry behavior.

## Regression Tiers

| Tier | Trigger | Minimum coverage |
| --- | --- | --- |
| Fast pull-request suite | Every backend change. | Unit tests for validation, baseline and anomaly rules, error mapping, structured-log allowlist, repository selection, and changed service behavior. |
| API contract suite | Every merge candidate. | Positive, negative, and boundary matrix cases for all ten endpoints using synthetic data, with status, acceptance-criteria, and response-contract assertions. |
| PostgreSQL workflow suite | Daily and before release. | Migration idempotency, tenant isolation, manager-portfolio isolation, upload worker completion, export worker completion, download reauthorization, audit correlation, and cleanup. |
| Resilience and concurrency suite | Before production release and after worker changes. | Concurrent claims, retry exhaustion, idempotency, failure recovery, and terminal lifecycle evidence. |
| Provider and performance suite | Before enabling dependent capabilities. | Identity, peer benchmark, storage, and PDF adapter contracts plus approved load and latency evidence. |

## Baseline Regression Inventory

The regression baseline retains the verified Stage 4 controls: safe configuration handling, controlled migration execution, safe error envelopes, strict anomaly-threshold behavior, timezone-aware CSV validation, structured-log field allowlisting, authorized export creation, durable-job behavior, and protected Neon workflow coverage.

Stage 5 expands this baseline to a complete FR-1 through FR-8 matrix. Each production defect must add a focused automated regression test at the lowest useful level and must be linked to its defect record before closure.

## Change Impact Rules

Any change to authentication, authorization, repository filters, export services, or download behavior requires the full PostgreSQL workflow suite. Any change to CSV parsing, daily aggregation, baseline logic, threshold configuration, or alert generation requires relevant unit tests plus upload-to-analytics worker-flow testing. Any change to schemas or routes requires the API contract suite for the changed endpoint and its authorization-negative cases.

Benchmark, PDF, storage, and external identity changes require adapter contract tests and explicit verification that unavailable or failed dependencies remain safe. A feature may not be enabled based only on mocked adapter results.

## Execution Evidence and Dispositions

Each regression execution must publish a sanitized run record that identifies the build or deployment, test environment, synthetic fixture version, feature-flag posture, execution date, suite result, and cleanup result. For API matrix execution, the record must preserve the actual status and result for each test case, the mapped acceptance criterion, and whether response-contract assertions passed. Credentials, raw meter readings, protected locators, signed URLs, and customer identifiers must never be included.

The only dispositions that count toward passing Stage 5 API evidence are **Pass** and a verified **Not Applicable** determination for functionality explicitly outside the backend API scope. **Fail**, **Blocked**, **Skipped**, and **Not Run** do not establish coverage. A provider-dependent enabled path that remains deliberately unavailable must be recorded as a passing fail-closed behavior only when the relevant matrix case verifies the implemented unavailable contract; it is not evidence that the enabled feature has passed.

## Release Gates

A release candidate passes regression only when all applicable tiers pass, all P0 and P1 defects are closed, safe evidence is retained, every required matrix case has a recorded disposition, response-contract assertions pass, and fixture cleanup completes. A skipped protected workflow, a disabled feature path, or an unavailable external integration is not equivalent to a passing enabled-path test. Such conditions must be shown as a limitation in the API readiness assessment and evaluated in the Go or No-Go decision.
