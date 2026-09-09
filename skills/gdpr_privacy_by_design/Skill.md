---
name: gdpr-privacy-by-design
description: 'Use this skill whenever a request involves system design or delivery
  artifacts for a system that collects, stores, transmits, or otherwise processes
  personal data AND there is a clear GDPR/UK GDPR nexus or GDPR-specific concepts
  are implicated.


  Trigger for:

  - Explicit mentions of GDPR, UK GDPR, EDPB, ICO, “privacy-by-design”, “lawful basis”,
  “Article 6”, “Article 9”, “special category data”, “controller/processor”, “joint
  controller”, “DSAR”, “right to erasure/access/portability”, “DPIA”, “SCC”, “adequacy
  decision”, “cross-border transfer”, “ROPA”.

  - EU/EEA/UK nexus indicators: EEA/UK data subjects, EU/UK establishment, offering
  goods/services to people in the EEA/UK, monitoring behavior in the EEA/UK, or hosting/processing
  decisions involving EEA/UK personal data.

  - System design or delivery artifacts where GDPR decisions are needed: architecture
  decisions, technology/hosting selection, vendor/SaaS selection, integrations/subprocessors,
  data modeling (schemas/events), API design, logging/telemetry/analytics, monitoring,
  backups/DR, UI/UX forms and consent flows, requirements analysis, user stories,
  acceptance criteria, product backlog items, epics, PRDs, and test plans.


  Trigger even when GDPR is not named explicitly ONLY when the request implies EU/UK
  personal data handling or GDPR-specific obligations (e.g., DSAR support, lawful
  basis selection, DPIA screening, controller/processor role decisions, or EEA/UK
  cross-border transfers).


  Do not trigger solely because the system processes personal data. If the request
  is primarily about other regimes or frameworks (e.g., HIPAA/PHI/BAA, SOC 2 controls/audit
  readiness), do not take the lead; ask which compliance regime is in scope or defer
  to the relevant skill.'
enabled: true
---

This skill supports GDPR privacy-by-design decisions during system design, requirements, and backlog/story creation, for B2E (employee/internal), B2B (business customer/external), and B2C (consumer) contexts.

Operating mode (choose based on the prompt and artefacts provided)
Select the most relevant mode(s) and tailor checks accordingly:
1) Requirements / user stories / backlog / test plan review
2) Design doc / architecture review
3) Data model / API / event schema review
4) UI / form / consent UX review
5) Code / config / IaC / logging review
6) Vendor / hosting / subprocessor review

If the artefact type is unclear, ask: “What artefact are we reviewing (stories, design doc, schema, code, vendor choice)?”

Step 0 — Determine applicable privacy regime(s)
Infer the likely regime(s) from context (organization location, data subject location, offering/monitoring, contracting entity, hosting region). Consider at least:
- EU GDPR (EEA)
- UK GDPR (UK)
(Consider other regimes only if explicitly relevant.)

If unclear, ask one clarifying question (e.g., “Are the data subjects primarily in the EEA, the UK, or both?”) and proceed with a brief dual-track analysis (EU+UK) until clarified.

Step 1 — Identify processing activities (mini-inventory)
Before selecting legal bases or DPIA screening, identify processing activities from the artefact(s). For each activity capture (as available):
- Purpose
- Data subjects (employees, customer contacts, end users, admins, etc.)
- Data categories (identifiers, contact data, HR data, usage logs, location, etc.)
- Special category / criminal-offence data indicators
- Recipients (internal teams, vendors/subprocessors)
- Storage/hosting locations and environments (prod/dev/test)
- Retention expectations (even if “TBD”)
- High-level security controls assumed (authn/authz, encryption, audit logs)

If information is missing, explicitly mark as Unknown and ask targeted questions.

If the prompt is about user stories/backlog/test plans and the retrieved context does not explicitly mention personal data, perform a quick “personal data likelihood scan” based on common patterns (accounts, identifiers, logs, analytics, HR, support) and proceed unless clearly non-personal.

Step 2 — Legal basis selection (Art. 6 + Art. 9 where applicable)
For each processing activity identified:
- Determine the Article 6 legal basis: consent, contract necessity, legal obligation, vital interests, public task, or legitimate interests.
- If special categories are involved (health, biometric, racial/ethnic origin, political opinions, religious beliefs, trade union membership, sex life/sexual orientation, genetic data), identify the applicable Article 9 condition.
- State the legal basis explicitly; do not assume consent by default.
- If legitimate interests is selected, provide a brief LIA summary (purpose/necessity/balancing) and flag if formal LIA documentation is needed.
- If consent is selected, confirm it can be freely given and withdrawn; flag heightened concerns in B2E contexts (power imbalance).

Step 3 — DPIA screening (WP248 criteria)
Screen each processing activity against the WP248 nine criteria:
- evaluation/scoring
- automated decision-making with legal/similarly significant effect
- systematic monitoring
- sensitive/highly personal data
- large-scale processing
- matching/combining datasets
- vulnerable data subjects
- innovative use/new technological or organizational solutions
- preventing data subjects from exercising a right or using a service/contract

Decision rule:
- If two or more criteria are met, conclude a DPIA is likely required and should be performed unless applicable supervisory authority guidance clearly indicates otherwise.
- If one criterion is met but the risk is clearly high (e.g., large-scale monitoring or special category data), also recommend DPIA.

If DPIA is likely/required, hand off to gdpr-documentation-generator for the DPIA template (do not generate the DPIA here).

Step 4 — Controller / joint controller / processor determination
For each data flow, determine the role:
- Controller: determines purposes and essential means
- Joint controller: shares determination with another party
- Processor: processes only on documented instructions of another party

Be explicit per activity/flow; an organization can be controller for one activity and processor for another in the same system.

Also flag required governance artefacts:
- Processor scenario → DPA requirements (incl. subprocessors, assistance, deletion/return)
- Joint controller scenario → Art. 26 arrangement need

Step 5 — Data minimization (and storage limitation)
Review any proposed data model, form, requirement, user story, acceptance criteria, or logging/telemetry plan for over-collection.
- Flag any field/event/log attribute where purpose is unclear or not necessary.
- Recommend removal, narrowing, or pseudonymization (e.g., age range instead of DOB).
- Include retention/deletion recommendations at least at a category level (even if “propose X months; confirm with policy/legal”).

Step 6 — Cross-border data transfers
For any hosting choice, third-party service, support tooling, remote admin access, or subprocessor:
- Determine whether personal data is transferred outside the applicable regime area (e.g., EEA/UK), including remote access from third countries and onward transfers by subprocessors.
- Identify the safeguard: adequacy decision, SCCs, BCRs, or other recognized mechanism.
- Do not assume a transfer is acceptable because a vendor is well known; state the safeguard or flag it as missing/unknown.
- If SCCs are used, flag that a TIA is typically needed (do not generate it here).

Framing rules (B2E vs B2B vs B2C)
Apply B2E (employee), B2B (business customer contacts/end users), or B2C (consumers) framing based on the request.
If unclear, ask or address all briefly and flag ambiguity.

B2C-specific checks (when relevant)
- Children/minors: ask if the service targets or is likely used by minors; flag age gating/parental consent considerations where relevant.
- Tracking/profiling: if analytics/ads/personalization, flag profiling/Art. 22 considerations and note that cookie/ePrivacy rules may also apply (flag only; do not generate cookie banner text here).

Output requirements (make results actionable)
Respond using this structure:

1) Regime assumption(s) + clarifying question (if needed)
2) Processing activities inventory (bulleted list or table)
3) Legal basis per activity (Art. 6 + Art. 9 if applicable; LIA/consent notes)
4) DPIA screening results (criteria hit + conclusion)
5) Roles & contracts (controller/processor/joint per flow; DPA/Art.26 flags)
6) Minimization + retention/deletion recommendations
7) Transfers & safeguards (incl. SCC/TIA flags)
8) Backlog/user story improvements (if the artefact is stories/requirements): propose privacy-by-design acceptance criteria (e.g., retention, DSAR hooks, logging redaction)

Scope boundary
Do not generate DPIA/ROPA/privacy notice/LIA/TIA/DPA documents. Hand off document creation to gdpr-documentation-generator. This skill outputs analysis and decisions to populate those documents.
