---
name: codewiki-generation
description: Generate, update, repair, or validate selected CodeWiki planes using DocumentationAgent and focused CodeWiki skills.
---

# CodeWiki Generation Workflow

## Purpose and activation

Use this system workflow only for explicit requests to generate, regenerate, extract, maintain, integrate, repair, or validate CodeWiki content.

Do not activate this workflow merely because an ordinary document is stored under `kavia-docs/CodeWiki/`. Generic documentation and architecture-document requests remain normal DocumentationAgent work unless the user explicitly requests CodeWiki plane maintenance.

If this workflow is unavailable or invalid, report that CodeWiki workflow execution is unavailable. Do not silently replace comprehensive CodeWiki work with an uncoordinated generic documentation invocation.

## Authoritative inputs

Preserve these inputs across every stage:

- The original user instructions, without paraphrasing away requirements.
- Canonical `request_details.codewiki_planes` selections.
- Attachments and relevant files.
- Continuation context when continuing the same bounded stage.
- Explicit exclusions and files discarded through partial approval.
- The active CodeWiki Generation Plan path and revision, when one exists.
- Repository guidance and dynamically supplied CodeWiki navigation guidance.

Treat repository source and canonical CodeWiki artifacts as evidence. Do not rely on a prose continuation summary when authoritative repository artifacts are available.

## Scope classification

Classify the request before scheduling documentation work.

### Targeted page maintenance

Use one bounded DocumentationAgent invocation when the request names a page or a small, concrete defect such as a link, breadcrumb, metadata, or content correction.

### Bounded plane update

Use one primary-plane invocation for a known subset of a plane. Add at most a focused continuation when required work remains concrete and another invocation is likely to make material progress.

### Comprehensive plane generation

Use independently bounded invocations for discovery, generation, or validation of one complete plane. Create a durable plan when the work is broad, dependency-sensitive, expected to require several invocations, or must be resumable.

### Multi-plane generation

Use one primary plane per generation stage, followed by shared integration and final validation. Create a durable plan unless the selected scope is demonstrably small and bounded.

### Validation or repair

Inspect only the selected scope, repair concrete violations when safe, and report unresolved evidence, link, navigation, or traceability defects. Do not regenerate unaffected content.

## Plane selection and ordering

Use `request_details.codewiki_planes` as the canonical plane-selection input. The orchestration boundary is responsible for normalizing enabled selections.

For multi-plane scheduling, use this default order when selected:

1. Architecture.
2. Features.
3. User Stories.
4. Additional requested planes in user-specified order.
5. Shared integration.
6. Final validation.

Preserve meaningful user order except when a dependency requires another order. Features must precede User Stories when story traceability requires stable Feature identifiers. Never add an unrequested plane.

## CodeWiki Generation Plan decision

Request the planning capability with the distinct `codewiki_generation_plan` profile when the work is:

- Broad or comprehensive.
- Multi-plane.
- Dependency-sensitive.
- Expected to require several DocumentationAgent invocations.
- Intended to be interrupted and resumed safely.
- Dependent on a durable inventory of completed and remaining scope.

Do not create a plan for a one-page correction, a small known repair, or other work likely to finish in one bounded invocation.

A CodeWiki Generation Plan is a coordination artifact, not a runtime state machine. It must not inherit source implementation-plan requirements or reproduce fixed passes.

## Focused skill requirements

Every CodeWiki documentation stage uses:

- `documentation_generation`
- `codewiki`

Add at most one specialized primary-plane skill:

- `codewiki_architecture`
- `codewiki_features`
- `codewiki_user_stories`

For an additional plane without a specialized skill, use only the two shared skills plus authoritative navigation guidance.

Do not inject every plane skill into one stage. Plane schemas remain exclusively owned by their specialized skills.

## Stage contract

Schedule one bounded primary-plane objective per generation stage. Pass the stage:

- The selected primary plane.
- The original request and relevant stage context.
- Relevant existing and expected artifacts.
- The focused required skills.
- A concrete objective and selected-scope boundaries.
- Completion and validation criteria from the applicable skills.
- The plan path, revision, and active stage when a plan exists.
- Any authoritative exclusions from interruption or partial approval.

DocumentationAgent performs repository inspection, document authoring, scoped validation, and file-operation emission. It does not choose plane order or run an internal CodeWiki loop.

## Ordinary Markdown handoff

Ask DocumentationAgent to finish each stage with concise ordinary Markdown in this shape:

```text
Stage outcome: complete | continue | blocked | failed

Objective:
- <bounded objective>

Completed:
- <material result>

Artifacts:
- <created or updated paths>

Validation:
- <checks performed and evidence>

Remaining:
- <required remaining work, if any>

Blockers:
- <blocker or uncertainty, if any>

Recommended next action:
- <focused repetition, next plane, integration, or stop>
```

This handoff is guidance, not a strict machine-parsed transport protocol. Interpret it alongside file operations, generated-document tracking, the active plan, and authoritative artifacts.

## Repetition and stopping

Repeat a stage only when all of these are true:

- Required completion criteria are not satisfied.
- Remaining work is concrete and bounded.
- Another invocation is likely to make material progress.
- Required predecessor artifacts are visible to the next invocation.
- Approval, interruption, and failure policies permit continuation.

Stop repeating and mark the stage blocked or complete-with-gaps when:

- The same required remaining scope is reported again.
- No relevant artifact was created or modified.
- Validation evidence did not improve.
- Another repetition is recommended without a concrete bounded objective.
- Only optional enrichment remains.
- Required files were discarded by the user.
- Authoritative staged predecessor artifacts are not visible.
- The existing failure threshold is reached.

The orchestrator LLM owns these repetition and stopping decisions by applying
the workflow criteria to authoritative artifacts, validation evidence, approval
outcomes, and the ordinary Markdown handoff. Do not add programmatic workflow
invocation counters, progress-signature state, pass names, page-count thresholds,
or a legacy pass-state mechanism.

## Shared integration

Run shared integration for comprehensive single-plane or multi-plane work after required plane stages are complete.

Inspect and, where safely bounded, update:

- Each selected plane index.
- The unified `kavia-docs/CodeWiki/index.md`.
- Required parent indexes.
- Breadcrumbs and relative links.
- Stable identifiers and cross-plane references.
- User Story traceability and generated backlinks when selected.
- Selected-scope write boundaries.
- Explicit exclusions and intentionally discarded files.

Use the actual selected-plane set as the integration boundary. Additional selected
planes receive the same shared index, breadcrumb, relative-link, stable-identifier,
and scope-boundary checks without acquiring a built-in plane schema. Unselected
planes must remain unchanged except for an explicitly owned cross-plane generated
region. Unselected planes must remain unchanged outside owned generated regions.

Do not duplicate plane-specific artifact validation in this stage.

## Final validation

Final validation must confirm:

- Required selected-scope artifacts exist.
- Selected pages are discoverable from the appropriate indexes.
- Breadcrumb targets and relative links resolve.
- Stable identifiers and required references remain consistent.
- User Story references and owned backlinks agree when applicable.
- No stage wrote outside its allowed scope.
- Required remaining work and unresolved blockers are reported accurately.

For behavior-focused validation, inspect representative seeded defects instead of
accepting a plausible narrative result. Scenarios must cover, as applicable:

- A targeted repair with a broken breadcrumb or relative link.
- A single-plane run with a missing or stale plane-index entry.
- A Features-plus-User-Stories run with a stale identifier, one-sided reference,
  or missing generated backlink.
- A complete built-in-plane run covering Architecture, Features, and User Stories.
- An additional-plane run proving shared validation without injecting an unrelated
  specialized schema.
- A validation-only run that reports concrete defects without regenerating
  unaffected content.
- A partially approved run where a discarded dependency remains excluded and
  dependent validation reports the conflict instead of recreating it.

For every scenario, compare the final artifacts with the canonical selected planes,
materialized paths, discarded paths, and owned generated regions. Report which
defects were repaired, which remain, and why.

Perform one bounded final repair only when the defects are concrete, safe, and within the invocation ceiling. Otherwise stop with a precise gap report.

## Approval, interruption, and staged visibility

Respect the runtime’s existing approval and interruption semantics.

- Never schedule a dependent stage against stale disk state.
- Use an explicit approved materialization checkpoint before any dependent
  stage reads predecessor artifacts. A checkpoint is authoritative only when
  its result reports `materialized` or `already_materialized`.
- Pass the checkpoint's materialized paths and explicitly discarded paths into
  the next stage context. Do not propagate an overlay identity between separate
  micro-agent invocations.
- Do not schedule filesystem-dependent follow-up work after `request_changes`,
  cancellation, rejection, timeout, infrastructure failure, or an overlay-only
  checkpoint result.
- On cancellation, stop and do not schedule another stage.
- On interruption, preserve the plan and exact safe resume point but do not auto-continue.
- After partial approval, treat discarded paths as authoritative exclusions and do not recreate them automatically.
- If a later stage requires a discarded dependency, stop and report the dependency conflict.
- On request-changes feedback, continue from the staged overlay baseline rather than re-emitting unchanged work.

## Failure handling

Apply existing workflow-generic failure thresholds.

Retry only with a concrete corrective objective. Preserve the original request, attachments, relevant files, normalized plane selection, continuation context, and plan reference.

If required inputs are absent or evidence is insufficient, mark facts as unknown, identify what was inspected, and report the blocker. Never invent repository facts or secret values.

## Completion

The workflow is complete when:

- Every required selected stage satisfies its completion criteria or records an explicit unresolved gap.
- Integration and final validation have completed when required.
- No required stage has concrete remaining work that can safely make progress.
- Approval, interruption, and exclusion outcomes are accurately represented.
- The final response lists material artifacts, validation evidence, unresolved requirements, and the safe next action.
