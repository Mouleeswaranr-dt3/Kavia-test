# EnerSight Stage 5 Backend Defect Log Template

[CodeWiki](../../index.md) / [Quality](../index.md) / [Backend QA](index.md)

## Purpose

This template records backend defects discovered during Stage 5 testing. Each record must describe observable behavior, preserve test traceability, and exclude credentials, tokens, raw meter readings, protected export URLs, and real customer information. Defects affecting authorization boundaries, data integrity, export protection, or unsafe information disclosure are treated as release-critical until resolved or formally accepted by the appropriate owner.

## Defect Record Template

| Field | Required content |
| --- | --- |
| Defect ID | Stable identifier, such as `ENS-BE-001`. |
| Title | Concise statement of the observed backend failure. |
| Date reported | UTC date and time. |
| Reporter | Tester or automation identity. |
| Environment and build | API version, deployment identifier, database test environment, and feature-flag state without secrets. |
| Requirement mapping | One or more of FR-1 through FR-8. |
| Test reference | API matrix ID, regression suite ID, or automated test name. |
| Acceptance-criteria mapping | Applicable FR acceptance-criteria identifier or identifiers, plus the functional-requirement mapping. |
| Endpoint and method | Route template and HTTP method; do not record sensitive query or body data. |
| Preconditions | Safe synthetic fixture and authorization context. |
| Reproduction steps | Numbered steps sufficient for another tester to reproduce the behavior. |
| Expected result | Contractually expected behavior, status code, state, or safety control. |
| Actual result | Observed safe response, persisted state, or test failure summary. |
| Response-contract result | Required fields, types, nullable fields, allowed states, and protected-data omission checks that passed or failed. |
| Evidence | Sanitized response excerpt, correlation identifier, safe log event, audit-event identifier, automated assertion output, or test output location. |
| Execution run | Sanitized run identifier, execution date, environment/build, and case disposition: pass, fail, blocked, or not run. |
| Severity | Critical, High, Medium, or Low. |
| Priority | P0, P1, P2, or P3. |
| Status | New, Triaged, In Progress, Ready for Retest, Verified, Deferred, or Closed. |
| Owner | Engineering owner accountable for remediation. |
| Root cause | Confirmed cause after investigation; leave pending until verified. |
| Fix and regression coverage | Change reference and the test added or updated to prevent recurrence. |
| Retest result | Tester, execution date, environment, and pass or fail outcome. |
| Release decision | Blocking, conditionally accepted, or non-blocking with approver and rationale. |

## Severity Guidance

A Critical defect includes cross-tenant disclosure, authentication bypass, export-download bypass, raw sensitive data disclosure, corruption of accepted meter data, or worker behavior that causes unrecoverable duplicate processing. A High defect includes failure of a required API flow, incorrect anomaly or baseline outcome that materially affects alerts, invalid CSV becoming usable data, or authorization failure within a manager portfolio.

Medium defects include incorrect safe state presentation, incomplete validation, incorrect ordering where authorization is intact, or missing audit correlation. Low defects include documentation-level response inconsistencies, non-blocking formatting defects, and observability fields that do not affect security or diagnosis.

## Execution-Evidence Handling

A blocked or not-run matrix case is not itself a software defect unless a product or test-harness failure caused the block. It must nevertheless be retained in the Stage 5 execution register with its reason, owner, and next action because it cannot contribute pass evidence to the stage gate. If a failed matrix case produces a defect, the defect record must retain the matrix ID, mapped acceptance criterion, response-contract assertion outcome, and sanitized run identifier so that the eventual retest can demonstrate closure.

Defect closure requires a verified retest in the intended PostgreSQL-backed synthetic-data environment. A source-code change, unit-test result, or prior Stage 4 evidence may support investigation, but it does not substitute for the failed Stage 5 API case unless the retest executes that case and records its actual outcome.

## Example Blank Entry

| Field | Value |
| --- | --- |
| Defect ID | ENS-BE-___ |
| Title |  |
| Requirement mapping |  |
| Test reference |  |
| Acceptance-criteria mapping |  |
| Severity and priority |  |
| Status and owner |  |
| Expected result |  |
| Actual result |  |
| Response-contract result |  |
| Execution run |  |
| Sanitized evidence |  |
| Fix and regression coverage |  |
