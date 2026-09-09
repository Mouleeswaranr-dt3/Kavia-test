---
name: gdpr-test-generation
description: 'Use this skill when the user asks to generate or expand test plans,
  test cases, acceptance tests, unit/integration tests, or QA checklists for features
  that process personal data AND there is a clear GDPR/UK GDPR nexus or GDPR-specific
  obligations are implicated.


  Trigger for requests such as:

  - “create a test plan” / “generate test cases” / “write unit tests” / “add integration
  tests”

  - Testing DSAR flows (access/export, deletion/erasure, rectification, restriction,
  objection)

  - Testing consent/permissions, preference center, opt-out, and tracking/analytics
  gating (especially B2C)

  - Testing data minimization (payloads/events), log redaction, masking/tokenization

  - Testing retention/TTL, deletion/anonymization jobs, and backup retention constraints

  - Testing access control, tenant isolation, least privilege, admin access auditing

  - Testing cross-border transfer controls (region pinning, vendor routing constraints)
  where implemented


  Trigger even when GDPR is not named explicitly ONLY when the request implies EU/UK
  personal data handling or GDPR-specific obligations (e.g., DSAR, DPIA-driven controls,
  EEA/UK transfer constraints) AND the user is requesting tests.


  Do not trigger for general GDPR analysis or document generation (use gdpr-privacy-by-design
  or gdpr-documentation-generator).

  Do not trigger solely because the system processes personal data.'
enabled: true
---

Purpose
Generate GDPR/UK GDPR-aligned test artifacts that verify privacy-by-design and security-of-processing behaviors in the implemented system. Focus on concrete, automatable tests and QA checks. Do not claim “GDPR compliant”; instead verify specific controls and behaviors.

Regime detection
Infer whether EU GDPR, UK GDPR, or both apply. If unclear, ask one clarifying question and proceed with a dual-track approach (EU+UK) where differences matter.

Operating mode (choose based on the prompt)
1) Test plan / QA checklist (manual + automated)
2) Acceptance criteria / BDD scenarios (Given/When/Then)
3) Unit tests (functions/services)
4) Integration/API tests
5) End-to-end tests (UI + backend)
6) Data pipeline/event/analytics validation tests

If the stack is unclear, ask:
- “What stack/test framework are we using (e.g., Jest/Pytest/JUnit/Cypress/Playwright)?”
- “Which endpoints/services store or expose personal data?”
- “Is this B2B/B2C/B2E and are data subjects in EEA/UK?”

Core test categories (apply as relevant)

A) Data minimization tests
- Verify only required fields are collected/stored/transmitted for each purpose.
- Verify optional fields are truly optional and default-off where intended.
- Verify analytics/events do not include direct identifiers unless explicitly required.

B) Logging & telemetry privacy tests
- Verify logs redact/mask personal data (emails, phone, tokens, IDs, addresses).
- Verify error traces do not leak payloads or secrets.
- Verify audit logs capture admin actions without over-collecting personal data.

C) Access control & tenant isolation tests
- Verify least privilege: users can access only their own data (and only necessary scopes).
- Verify admin/support access is gated, time-bound (if applicable), and audited.
- Verify multi-tenant isolation (no cross-tenant reads/writes via IDOR or query filters).

D) DSAR behavior tests (when applicable)
- Access/portability: export includes all relevant data, in expected format, within authorization rules.
- Erasure: deletion/anonymization removes data from primary stores and derived stores (indexes/caches), and prevents reappearance.
- Rectification: updates propagate to downstream systems where required.
- Restriction/objection: flags prevent further processing for the restricted purpose (e.g., marketing).

E) Retention & deletion job tests
- Verify TTL/retention policies execute on schedule.
- Verify deletion jobs are idempotent and auditable.
- Verify backup retention is configured as intended; if deletion from backups is delayed, verify documented behavior and restoration handling.

F) Consent / preferences / tracking tests (especially B2C)
- Verify tracking/analytics/ads events are blocked until consent (where required by design).
- Verify withdrawal of consent stops future tracking and triggers downstream changes where applicable.
- Verify preference center updates are enforced across services.

G) Security-of-processing tests (Art. 32 aligned behaviors)
- Verify TLS enforced; insecure HTTP rejected where applicable.
- Verify encryption-at-rest settings are enabled in config/IaC (where testable).
- Verify secrets are not present in client bundles, logs, or config dumps.
- Verify rate limiting and abuse controls on sensitive endpoints (login, export, delete).

H) Cross-border/region controls tests (only if implemented)
- Verify data residency/region pinning rules (e.g., EU tenant stays in EU region).
- Verify vendor routing respects configured region constraints.

B2E/B2B/B2C framing
- B2E: include tests for role-based access (HR/manager), monitoring proportionality controls (if implemented), and strict auditability.
- B2B: include tenant isolation, admin delegation, and processor-style audit logging.
- B2C: include consent gating, profiling flags (if applicable), and minors/age-gating tests if relevant.

Output requirements (always)
1) Assumptions + clarifying question(s) (only if needed)
2) Test scope summary (features/endpoints/data categories)
3) Test plan organized by category (A–H above)
4) For each test: objective, steps, expected result, and automation level (unit/integration/e2e/manual)
5) Suggested test data strategy (synthetic/anonymized; avoid prod data in non-prod)
6) Coverage gaps / needs confirmation (retention periods, consent model, DSAR scope, vendor routing rules)

Scope boundary
Generate tests and QA checks for GDPR/UK GDPR risk reduction behaviors. Not legal advice or a compliance guarantee. Do not generate DPIA/ROPA/privacy notice/LIA/TIA/DPA.


