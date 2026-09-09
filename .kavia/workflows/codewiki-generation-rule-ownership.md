# CodeWiki Generation Rule Ownership Checklist

This checklist records the target owner for rules currently present in the legacy `codewiki_creation_agent_prompt.j2`. It is an implementation traceability artifact, not a discoverable workflow because it has no workflow front matter.

| Legacy rule or behavior | Target owner | STEP-01 disposition |
| --- | --- | --- |
| Explicit CodeWiki activation and generic-documentation bypass | Orchestrator routing plus `codewiki-generation` workflow | Workflow activation boundary documented |
| Targeted, bounded, comprehensive, multi-plane, and validation classification | `codewiki-generation` workflow | Migrated |
| Plan-use decision for broad or resumable work | `codewiki-generation` workflow | Migrated |
| One primary plane per generation stage | `codewiki-generation` workflow | Migrated |
| Architecture, Features, User Stories, then additional-plane ordering | `codewiki-generation` workflow | Migrated |
| Features before User Stories when traceability requires stable IDs | `codewiki-generation` workflow | Migrated |
| Ordinary stage handoff | `codewiki-generation` workflow | Migrated |
| Repetition and no-material-progress guidance | `codewiki-generation` workflow | Migrated as semantic guidance |
| Approval, interruption, partial-approval, and failure behavior | Workflow guidance plus generic runtime | Workflow responsibilities documented; runtime implementation remains in later steps |
| Total invocation ceiling and deterministic progress bookkeeping | Generic runtime | Reserved for STEP-05; no CodeWiki-specific state added |
| Root write constraints and selected-scope boundaries | Shared `codewiki` skill | Migrated |
| Unified and plane index discoverability | Shared `codewiki` skill | Migrated |
| Stable identifiers and relative links | Shared `codewiki` skill | Migrated |
| Manual content and generated-region preservation | Shared `codewiki` skill | Migrated |
| Cross-plane dependency awareness and integration | Shared `codewiki` skill plus workflow integration stage | Migrated |
| Shared front matter and breadcrumb expectations | Shared `codewiki` skill, specialized by active plane guidance | Migrated without duplicating plane schemas |
| General evidence, headings, links, indexes, and secret protection | `documentation_generation` skill | Migrated |
| Architecture IR and derived-page structure | `codewiki_architecture` skill | Retained; cleanup and PASS_STATE removal deferred to STEP-06 |
| Features Area → Feature → Capability → Behavior contract | `codewiki_features` skill | Retained; cleanup and PASS_STATE removal deferred to STEP-06 |
| User Story schema and generated backlink ownership | `codewiki_user_stories` skill | Retained; cleanup and PASS_STATE removal deferred to STEP-06 |
| Additional-plane artifact schema | Runtime navigation guidance plus shared `codewiki` skill | No generic schema invented |
| Mermaid syntax rules | Specialized plane skill when diagrams are part of that plane’s contract | Not duplicated in shared skills |
| Complexity-specific fixed pass plans | Removed | Replaced by workflow classification and bounded objectives |
| PASS_STATE format, parsing, reinjection, and invariants | Removed | No replacement protocol added |
| Per-iteration budgets and finish mode | Removed from content policy | Runtime-generic safety controls remain later work |
| Legacy `request_details.modes` compatibility | Removed from target workflow contract | Canonical `codewiki_planes` normalization remains STEP-02 |
| Agent-local plane controller selection | Removed | Workflow and orchestration own stage selection |
