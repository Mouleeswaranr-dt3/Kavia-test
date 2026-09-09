---
name: codewiki
description: Apply shared CodeWiki placement, evidence, navigation, identifier, integration, and selected-scope rules for explicit CodeWiki maintenance.
owner: system
source_ecosystem: kavia-system
---

# codewiki

Use this skill only when the request explicitly concerns CodeWiki generation, regeneration, extraction, maintenance, repair, integration, or validation.

Ordinary documentation that happens to be stored under CodeWiki should use general documentation guidance unless it participates in CodeWiki plane maintenance.

## Root and selected scope

- The canonical root is `kavia-docs/CodeWiki/`.
- Write only within the selected plane or shared integration scope assigned to the stage.
- Use canonical `request_details.codewiki_planes` selections supplied by orchestration.
- Do not add an unrequested plane.
- For additional planes without a specialized skill, follow authoritative runtime navigation guidance and the shared rules in this skill.
- Inspect existing artifacts before generating replacements.
- Prefer targeted maintenance over comprehensive regeneration when the request is bounded.

## Evidence and canonical artifacts

- Use repository implementation and interface evidence for current-state claims.
- Preserve canonical machine-readable artifacts and derive Markdown from them where a plane contract requires that relationship.
- Do not replace a specialized plane’s canonical model with a shared Markdown convention.
- Mark unsupported claims as unknown and report the inspected evidence.
- Never expose secret values. Document environment-variable names only when evidenced and relevant.

## Stable identifiers and manual regions

- Preserve existing stable identifiers and filenames unless the user explicitly requests a migration.
- Keep links synchronized with stable identifiers.
- Preserve manual content outside clearly marked generated regions.
- Modify a generated region only according to the specialized skill that owns it.
- Treat files discarded through partial approval as authoritative exclusions.

## Navigation and formatting

- Maintain the selected plane’s `index.md`.
- Keep selected outputs discoverable from required parent indexes.
- Update the unified `kavia-docs/CodeWiki/index.md` only when the selected change affects unified navigation or shared entry-point content.
- Preserve manual unified-index content outside owned generated regions.
- Use relative Markdown links only.
- Every CodeWiki Markdown page must follow the active navigation guidance for front matter and breadcrumbs.
- Breadcrumbs must use relative links to existing or simultaneously created parent index pages and appear before the H1.
- Use one H1 and a valid heading hierarchy.
- Verify links from the current page’s directory.

## Cross-plane awareness

- Keep each primary generation stage focused on one plane.
- Do not modify another plane except for an explicitly owned cross-plane generated region.
- Features must exist with stable identifiers before User Story traceability is created or validated when that dependency applies.
- Do not invent Feature or Capability entities to satisfy a User Story reference.
- Report missing dependencies rather than silently broadening scope.

## Integration and final validation

For comprehensive or multi-plane work, inspect:

- Selected plane indexes.
- The unified CodeWiki index.
- Required parent-index links.
- Breadcrumbs and relative links in selected scope.
- Stable identifiers and cross-plane references.
- User Story traceability and owned backlink regions when applicable.
- Stage write boundaries and explicit exclusions.

Repair only concrete, bounded defects within the assigned stage. Report unresolved issues, missing evidence, discarded dependencies, and the safe next action.

## Centralized implementation paths

When source code must resolve CodeWiki or Spec Builder paths:

- Use existing centralized path accessors and CodeWiki builders.
- Do not introduce hard-coded production repository paths.
- Keep generation and integration logic in UI-independent core modules rather than desktop UI adapters.

## Completion

A shared CodeWiki stage is complete when:

- Required selected-scope artifacts exist or an evidence-backed gap is reported.
- Required indexes expose those artifacts.
- Front matter and breadcrumbs follow active destination guidance.
- Relative links and stable references are valid for the inspected scope.
- Manual and generated-region ownership is preserved.
- No out-of-scope plane content was changed.
- Changed artifacts, validation evidence, and concrete remaining work are reported.

## Explicit exclusions

This skill does not define:

- Architecture IR or per-entity Architecture page schemas.
- Product Area, Feature, Capability, or Behavior schemas.
- User Story schemas or generated-backlink formats.
- Fixed pass plans or internal iteration identifiers.
- PASS_STATE or any replacement state protocol.
- Runtime retry thresholds, invocation ceilings, or progress signatures.
- Orchestrator request envelopes or transport rules.
- Whether a durable CodeWiki Generation Plan is required.
