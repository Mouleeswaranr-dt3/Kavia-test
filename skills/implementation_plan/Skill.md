---
name: Implementation Plan
description: Create or refine an implementation plan that gives developers concrete architecture, component, interface, file-level, execution, and verification details while returning schedulable steps to the orchestrator.
owner: system
source_ecosystem: kavia-system
---

# Implementation Plan

Use this skill when the user explicitly requests an implementation plan, asks to turn an approved design or specification into an executable implementation run, or when an active workflow explicitly requests a durable `codewiki_generation_plan`.

Do not use it for a direct code change, a generic task list, or a specification that is not intended to guide implementation.

## Planning profiles

Select exactly one profile before creating or updating a plan:

- `implementation_plan` coordinates developer implementation and uses the architecture, file-level change, acceptance, validation, approval, and execution contract described below.
- `codewiki_generation_plan` coordinates broad, multi-stage, dependency-sensitive, interrupted, or explicitly resumable CodeWiki documentation work.

Reject an ambiguous request that selects both profiles. Do not merge their front matter, step fields, completion rules, or orchestrator response contracts, and do not silently fall back to `implementation_plan`. A bounded CodeWiki request that can be completed safely in one documentation stage does not require a durable plan unless the workflow explicitly requests one.

## Goal

Produce a compact, evidence-based implementation contract that answers:

1. What relevant architecture exists?
2. What design decisions are made?
3. Which components, interfaces, and files change?
4. What changes in each location?
5. In what order should the work be executed?
6. How will each requirement be verified?

Optimize for a developer implementing the change. Prefer repository-specific facts, decisions, tables, identifiers, and observable behavior over explanatory prose.

## Evidence and planning depth

Inspect the relevant code, interfaces, tests, and source documents before planning. Use exact existing file paths, symbols, components, and commands when verified. Mark uncertainty rather than inventing details.

Use concise depth for low-risk, well-scoped changes. Use full depth when work is cross-component, architectural, ambiguous, security-sensitive, destructive, migration-related, or otherwise high risk. Depth must add implementation detail, not repeated prose.

Select one implementation approach whenever evidence permits. Do not leave “A or B” choices in executable steps. If an unresolved choice changes architecture, interfaces, scope, or acceptance behavior, record it as an open decision and keep the plan in `draft` until resolved or explicitly delegated.

## Canonical artifact

The Markdown plan is the canonical artifact. Do not create a sidecar lifecycle store or duplicate plan state.

Store both planning profiles in the repository's dedicated plans artifact area. Resolve the CodeWiki destination through `code_generation_core_agent.spec_builder.paths.codewiki_plans_root_rel()` rather than introducing another hard-coded production path. Master plans and milestone sub-plans remain in that plans area unless an established path helper selects a more specific child directory.

Every plan file must begin with YAML front matter at byte 0. The opening `---` must be the first line of the file, with no breadcrumb, title, blank line, comment, or code fence before it. Close the front matter with `---`, then add any required breadcrumb, a blank line, and the Markdown H1 title. A YAML-looking block placed after the breadcrumb or title is body content and is invalid.

New or adopted `implementation_plan` artifacts begin with front matter equivalent to:

```yaml
---
artifact_type: implementation_plan
plan_id: <stable-plan-id>
title: <title>
status: draft
revision: 1
approved_revision: null
approval:
  state: pending
execution:
  state: not_started
  executing_revision: null
risk_level: low
plan_depth: concise
source_specs: []
primary_references: []
other_references: []
dependencies: []
open_questions: []
acceptance_criteria:
  - id: AC-01
    text: <observable completion condition>
validation_strategy:
  - id: VAL-01
    validates: [AC-01]
    method: <command, test, inspection, or observed behavior>
steps:
  - id: STEP-01
    title: <action-oriented title>
    agent: <responsible micro-agent or TBD>
    container: <container name or all>
    depends_on: []
    acceptance: [AC-01]
    validation: [VAL-01]
    recovery: <safe retry, rollback, cleanup, or not_applicable>
    status: to_do
revision_history: []
---
```

Requirements:

- The file's first three characters are `---`; there is exactly one opening front-matter block, and it parses as YAML.
- CodeWiki breadcrumb and title content appear only after the closing front-matter delimiter.
- `plan_id` remains stable.
- `revision` increases for substantive plan changes.
- `primary_references` contains the governing request, specification, or design.
- `other_references` contains supporting code, tests, documents, and related plans.
- `steps` is the machine-readable execution contract and must match the body and response.
- Each step contains `id`, `title`, `agent`, `container`, `depends_on`, `acceptance`, `validation`, `recovery`, and `status`.
- `recovery` names the safe retry, rollback, cleanup, or checkpoint behavior for risky or non-idempotent work; otherwise use `not_applicable`.
- Use `TBD` only when ownership genuinely cannot be resolved.
- Use `all` only for work that is not container-specific.
- Acceptance and validation entries use stable IDs so other sections can reference them without repeating their full text.

### CodeWiki generation plan contract

A new `codewiki_generation_plan` begins with front matter equivalent to:

```yaml
---
artifact_type: codewiki_generation_plan
plan_id: <stable-plan-id>
title: <title>
status: draft
revision: 1
workflow: codewiki-generation
selected_planes: []
source_request:
  user_instructions: <original request or durable factual summary>
  relevant_files: []
completed_scope: []
remaining_scope: []
blockers: []
safe_next_action: <first dependency-ready stage or explicit blocked action>
stages:
  - id: STAGE-01
    title: <action-oriented documentation stage>
    agent: DocumentationAgent
    depends_on: []
    focused_skills:
      - documentation_generation
      - codewiki
    artifacts: []
    validation:
      required: []
      evidence: []
    status: to_do
revision_history: []
---
```

CodeWiki generation plan requirements:

- `artifact_type` is exactly `codewiki_generation_plan`; implementation-only approval, risk, plan-depth, acceptance-matrix, file-change, and developer recovery fields are not required.
- `plan_id` and stage IDs remain stable across updates.
- `selected_planes` preserves normalized user order, including additional planes, with only required dependency ordering applied by the workflow.
- Each stage names one responsible agent, dependency stage IDs, focused skills, expected artifacts, required validation, captured evidence, and status.
- Documentation stages use `documentation_generation`, `codewiki`, and at most one selected-plane skill. Integration or validation stages use only the skills required by their bounded scope.
- `completed_scope`, `remaining_scope`, `blockers`, and `safe_next_action` provide sufficient durable state to resume without reconstructing prior stages from chat history.
- A stage is complete only when its expected artifacts exist and its required validation evidence is recorded. Checking an activity box or receiving a plausible narrative response is insufficient.
- The body mirrors stage order and status and contains an implementation tracker only when it materially improves resumability. Front matter remains the machine-readable scheduling contract.
- The CodeWiki workflow owns the decision to create or bypass this profile. The planning skill owns artifact shape and lifecycle consistency but does not create a second execution loop.

Use these exact step states:

- `⏳` = `to_do`
- `🔄` = `in_progress`
- `✅` = `complete`
- `⏭️` = `skipped`
- `❌` = `failed`

New steps begin as `to_do`. Keep front matter, body status, tracker state, and the execution record consistent.

## Adaptive document structure

Do not use the ladder format unless the user explicitly requests it. Select the lightest profile that preserves implementation safety and clarity:

- **Concise** — local, low-risk, well-understood work. Use outcome and boundaries, a short proposed change, and self-contained execution steps.
- **Standard** — normal multi-file, multi-layer, or existing-flow integration work. Add relevant current architecture and a proposed-change overview, then keep detailed decisions, interfaces, code shape, and files inside their owning steps.
- **Large/cross-cutting** — major architectural, multi-container, migration, security-sensitive, destructive, or independently staged work. Use a master plan for shared context and cross-cutting decisions; create milestone sub-plans only when their independent review and execution value exceeds synchronization cost.

The front-matter `plan_depth` must identify the selected profile. Do not add sections merely to satisfy a template.

### 1. Outcome and boundaries

State the intended observable result, included scope, non-goals, and invariants that must remain unchanged. Keep this section short. Do not repeat front-matter acceptance criteria.

### 2. Current architecture

Include this section for standard and large plans, or when a concise plan cannot safely explain the change without it. Describe only relevant:

- component boundaries and responsibilities;
- control, data, and dependency flow;
- state ownership and persistence;
- public or internal interfaces;
- extension points and constraints.

Use verified repository identifiers. A generic architecture description that could apply to another project is insufficient.

### 3. Proposed change overview

Explain the selected end-state design, the main change flow, and how the ordered steps produce it. This is the narrative bridge between current architecture and implementation; keep it concise and do not duplicate step details.

Add a small Mermaid system map or change-flow diagram only when cross-component interactions, state transitions, asynchronous flow, migration stages, or current-versus-proposed boundaries are materially easier to understand visually. Use exact verified component names. Do not add a diagram that merely restates a short table or list.

For a large plan, keep cross-cutting decisions and system-wide component/interface changes here in compact tables. For concise and standard plans, place decisions and technical changes in the step that owns them.

### 4. Execution steps

Provide the fewest independently schedulable steps that preserve ownership, dependency, and container boundaries. The step is the primary unit for reviewing, implementing, and resuming work.

Each step must contain:

- stable step ID and action-oriented title;
- owner, container, status, and dependency step IDs;
- objective;
- a one-sentence **Definition of done** describing the observable completion boundary;
- **Technical approach**, including the local decisions, rationale, code shape, and relationship to the larger plan;
- **Changes**, naming exact files, symbols, components, and interfaces owned by the step;
- acceptance and validation;
- safe retry, rollback, cleanup, or checkpoint behavior when the work is risky or non-idempotent;
- implementation tracker.

Use this step-local change table when multiple files or interfaces are involved:

| File/component and symbol | Concrete change or resulting code shape | Integration/compatibility impact | Acceptance/validation |
| --- | --- | --- | --- |

For a very small step, precise paragraphs or bullets may replace the table. In either form:

- Name exact files and symbols when verified.
- State the resulting interface or code shape, not merely that something will be “reviewed,” “updated,” or “handled.”
- Include new, deleted, moved, configuration, migration, documentation, and test files when applicable.
- Every planned production-code change must belong to exactly one implementation step unless shared mechanical work is explicitly grouped.
- State when an unchanged interface constrains implementation.
- Use component-level scope only when exact files genuinely cannot be identified, and explain the uncertainty.

IDs support traceability but must not replace local meaning. On first use within a step, pair each referenced ID with a short human-readable label, for example: `DEC-02 — preserve the existing event contract`. A developer must understand the step without scrolling to decode a list of IDs.

Global decision, interface, or file inventories are optional and reserved for large plans where information is genuinely shared across several steps. Do not create one giant file-level table that mixes otherwise step-owned work.

#### Implementation Tracker

Every implementation step must include `#### Implementation Tracker`.

Tracker rules:

- Start unchecked items with `- [ ]`.
- Use one checkbox per independently verifiable code, configuration, migration, documentation, or test change.
- Nested checkboxes are for distinct file/component modifications or required validation, not paraphrases of their parent.
- Do not include investigation already completed during planning.
- Do not ask the implementer to rediscover architecture or inventory controls that the planner should have inspected.
- Every item must name a file/component, interface, decision ID, acceptance ID, validation ID, or observable result.
- Prefer 3–7 top-level tracker items per step. Exceed this only when the implementation genuinely contains more independently verifiable units.
- Keep trackers aligned with the file/component matrices without copying their prose verbatim.

#### Full-application grouping

For full-application or equivalent end-to-end work:

- Never combine implementation work from different containers into one step.
- For multiple containers, use one implementation step per applicable container followed by one final integration step.
- Order frontend, database when present, backend, and final integration unless verified dependencies require another order.
- Represent internal container work in its tracker rather than splitting the container into many scheduler steps.
- For a single-container full application, use one CodeWritingAgent implementation step.
- Add a separate DocumentationAgent step only when documentation is independently necessary.
- Test-writing or independent-verification steps may be separate scheduler steps, but they must reference the shared acceptance and validation IDs rather than restating the design.

#### Master and milestone plans

For genuinely large work, the master plan may delegate a scheduler step to a separate milestone plan. Create a milestone plan only when the milestone:

- can be reviewed, approved, implemented, and validated independently;
- has a distinct architectural, container, ownership, rollout, or recovery boundary;
- requires enough technical detail that keeping it inline would materially obscure the master plan; or
- is expected to be resumed independently by another agent or team.

Do not split documents merely because a plan has several steps. The master plan owns the overall outcome, shared architecture, cross-cutting decisions and invariants, milestone dependencies, and end-to-end acceptance. Each milestone plan owns its local definition of done, technical approach, files and interfaces, tracker, validation, recovery, and execution record.

Reference milestone artifacts by repository-relative path from the master step and return that path in the orchestrator step `scope`. Keep shared facts authoritative in the master and local facts authoritative in the milestone; do not copy entire sections between documents. A milestone executor must still be able to work from the milestone plan, its explicitly referenced master context, and the working tree without repeating repository discovery.

### 7. Acceptance and verification matrix

Use a single mapping table:

| Acceptance ID | Observable result | Validation ID | Method or command | Expected evidence |
| --- | --- | --- | --- | --- |

Every acceptance criterion must have at least one validation method. Include exact commands and expected observations when known. Do not repeat this content in step acceptance paragraphs.

### 8. Risks and open decisions

Use compact tables.

| Risk ID | Concrete failure mode | Mitigation or recovery | Affected steps |
| --- | --- | --- | --- |

| Open decision | Owner | Impact if unresolved | Required before |
| --- | --- | --- | --- |

Include only material risks. Avoid generic statements such as “tests may fail” or “implementation may be complex.”

### 9. Execution record

At creation, use only this compact baseline:

| Record | Current state |
| --- | --- |
| Progress | Not started; resume at STEP-01 |
| Discoveries/deviations | None beyond planning evidence |
| Validation evidence | None |
| Outcomes | Pending |

During execution:

- Proceed to the next dependency-ready step without asking the user for routine next-step confirmation.
- At every stopping point, update tracker items and step status to distinguish completed work from the exact remainder; never leave partially completed work represented as wholly `to_do` or `complete`.
- Record concise dated entries for completed work, material discoveries or deviations, decisions, validation evidence, recovery actions, safe resume points, and final outcomes.
- When evidence requires a design or scope change, update the affected plan sections and apply the lifecycle consistency rules before continuing.
- Do not write paragraphs merely to say work has not started.

## Orchestrator response contract

When creating or refining a plan, the micro-agent response must include the ordered execution units. A summary or artifact link alone is invalid.

For `implementation_plan`, use this exact heading:

```markdown
## Execution Steps for Orchestrator
```

Provide one numbered item per step with:

- `step_id`
- `title`
- `objective`
- `definition_of_done`
- `owner`
- `container`
- `scope`
- `depends_on`
- `decision_ids`
- `acceptance_ids`
- `validation_ids`
- `recovery`

The response steps must match the canonical plan revision, front-matter `steps`, and body order. They must contain enough information for the orchestrator to schedule downstream agents without reconstructing tasks from narrative prose.

Keep IDs for machine correlation, but include short human-readable labels with decision, acceptance, and validation references when the identifiers alone would require the orchestrator or developer to reconstruct meaning from another section.

For `codewiki_generation_plan`, use this exact heading:

```markdown
## CodeWiki Stages for Orchestrator
```

Provide one numbered item per stage with:

- `stage_id`
- `title`
- `objective`
- `definition_of_done`
- `agent`
- `depends_on`
- `focused_skills`
- `artifacts`
- `validation_required`
- `validation_evidence`
- `status`
- `blockers`
- `safe_next_action`

The response stages must exactly match the canonical plan revision, front-matter `stages`, and body order. Completed and remaining scope, blockers, and the safe next action must agree with the saved artifact so scheduler-facing output cannot claim progress absent from the plan.

Keep surrounding response prose brief: outcome, unresolved blocking decisions, material risks, artifact link, then the complete orchestrator step list.

## Lifecycle consistency

Keep lifecycle handling minimal:

- An `implementation_plan` is executable only when the relevant revision is approved, and it records the executing revision when implementation starts.
- A `codewiki_generation_plan` follows the parent workflow's approval and interruption semantics rather than introducing developer implementation approval fields.
- Progress-only updates are revision-neutral: recording stage status, validation evidence, completed scope, remaining scope, blockers, or the next safe action without changing the committed contract does not increment `revision`.
- Increment an `implementation_plan` revision when scope, architecture, interfaces, acceptance criteria, dependencies, recovery requirements, security/privacy impact, or committed validation materially changes.
- Increment a `codewiki_generation_plan` revision when selected scope, stage definitions, stage dependencies, expected artifacts, completion criteria, focused-skill ownership, or required validation materially changes.
- Pause for the applicable workflow reapproval after a material revision change.
- Preserve concise revision and execution evidence in the Markdown artifact.
- Do not duplicate lifecycle explanations throughout the plan.

## Information-density rules

Apply these rules to every plan:

- State each fact in one authoritative location.
- Reference stable IDs instead of restating decisions, acceptance criteria, validation, and risks.
- Do not copy front-matter lists into narrative prose.
- Do not restate tracker items as milestones or step paragraphs.
- Milestones are optional and should appear only when they communicate delivery increments not already clear from execution steps.
- Prefer tables for architecture impacts, decisions, file changes, interfaces, validation, and risks.
- Every paragraph must add a repository fact, design decision, constraint, implementation detail, or material rationale.
- Remove advice that could be pasted unchanged into an unrelated project.
- Remove speculative alternatives after choosing a design.
- Remove generic setup language, repeated scope summaries, and “not started” prose.
- Do not optimize for document length; optimize for useful implementation facts per paragraph.

## Readiness and compression gate

Before presenting a plan as ready:

1. Verify the artifact is stored in the dedicated implementation-plan area, not a detailed-design or generic specification area.
2. Verify the opening `---` is at byte 0, the front matter parses as YAML, and breadcrumb/title content follows its closing delimiter.
3. Verify all structured IDs resolve.
4. Verify architecture and design claims are grounded in inspected sources.
5. Verify core design choices are decided or explicitly blocking.
6. Verify the selected planning profile matches task type, complexity, risk, and execution boundaries.
7. Verify every step has an observable definition of done and enough inline meaning to execute without decoding bare IDs elsewhere.
8. Verify every production change belongs to a step and each step-local file/component entry states the concrete change, resulting code shape, and integration impact.
9. Verify global tables exist only when information is genuinely shared across several steps.
10. Verify front-matter, body, trackers, milestone references, and response steps agree.
11. Verify every acceptance ID maps to validation and expected evidence.
12. Verify full-app container grouping and master/milestone boundaries are correct when applicable.
13. Remove duplicated facts and replace repeated prose with labeled ID references where traceability is useful.
14. Remove tracker items that repeat completed planning analysis.
15. Collapse empty lifecycle sections to the compact execution-record table.
16. Verify risky or non-idempotent steps include a usable retry, rollback, cleanup, or checkpoint path.
17. Remove any paragraph or diagram that does not add a decision, verified fact, constraint, actionable change, flow clarification, or material rationale.

A fresh developer must be able to implement the change from the plan and working tree without repeating the planner’s repository analysis.
