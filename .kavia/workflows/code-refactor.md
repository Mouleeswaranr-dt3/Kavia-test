---
name: code-refactor
description: Refactor existing code safely through baseline analysis, scoped planning, incremental changes, verification, and review.
---

# Code Refactor

Use this workflow when the user asks Kavia to improve the internal structure, readability, maintainability, performance, or design of existing code while preserving its intended externally observable behavior.

Follow the applicable stages in order. Keep each stage focused on its purpose, respect normal approval and failure-handling rules, and adapt agent selection to the available capabilities and the user's explicit instructions.

## Expanded sub-steps

A parent stage may be expanded into smaller executable steps when its scope requires more detail. PlanningAgent may perform this expansion and translate its plan into the normal pending-step structure.

Expanded steps belong beneath their parent stage and do not replace or reorder the eight parent stages. Track each expanded step independently, execute it with the appropriate micro-agent, and display known expanded steps as an indented nested list beneath the parent stage in the workflow UI. Use the same completed, current, and upcoming states used for parent stages.

## Stage 1: Audit, Understand & Baseline

Audit the relevant code and establish what it currently does before changing it.

- Identify the affected behavior, entry points, dependencies, public interfaces, constraints, and existing conventions.
- Inspect the implementation and its callers using the appropriate code-analysis agent.
- Create a refactor-audit document with DocumentationAgent that identifies all discovered code areas that should be refactored, why each area needs attention, its dependencies and risks, and a suggested priority.
- Distinguish findings that belong to the current request from broader opportunities that should remain deferred.
- Record the current verification state using existing tests, static checks, reproducible behavior, or another suitable baseline when requested or necessary.
- Surface uncertainties that could make behavior-preserving changes unsafe.

**Outputs**

- A refactor-audit document containing the relevant files, modules, classes, functions, or other code areas that should be refactored.
- For each finding: the observed problem, refactor rationale, affected behavior and interfaces, dependencies, risks, priority, and whether it is in scope.
- A baseline summary of current behavior and available verification evidence.

Complete this stage when the audit document covers the discovered refactor candidates and the current behavior and important constraints are sufficiently understood to define the refactor safely.

## Stage 2: Define Refactor Target

State the concrete outcome and boundaries of the refactor.

- Describe the structural or quality problem being addressed.
- Identify the intended improvement and the behavior or interfaces that must remain unchanged.
- Define in-scope and out-of-scope code.
- Establish practical completion criteria and any relevant quality constraints.

Do not allow unrelated feature work or speculative redesign to enter the refactor unless the user explicitly expands the scope.

**Outputs**

- An approved refactor-target definition, either as a concise workflow artifact or as a dedicated specification document when the scope warrants one.
- A list of selected audit findings, protected behaviors and public interfaces, scope exclusions, and completion criteria.

## Stage 3: Plan Safe Increments

Use PlanningAgent when the refactor requires a multi-step plan or when the user requests planning.

- Divide the refactor into small, reviewable increments that preserve behavior.
- Sequence dependency-sensitive changes so each increment leaves the codebase coherent.
- Associate each increment with the appropriate micro-agent and verification.
- Identify rollback boundaries, high-risk areas, and stages that should be expanded into nested executable steps.
- Follow the normal plan approval rules before execution when approval is required.

PlanningAgent output may expand this or any later stage into multiple nested steps. Preserve those steps under the corresponding parent stage in workflow status displays and pending-step tracking.

**Outputs**

- An implementation plan containing ordered, reviewable refactor increments.
- Expanded nested workflow steps and normal pending-step entries for increments that require separate execution.
- Per-increment ownership, dependencies, risks, verification expectations, and rollback boundaries.

## Stage 4: Strengthen the Safety Net (Conditional)

Apply this stage when the existing baseline does not provide enough confidence to refactor safely.

- Add or improve focused characterization, unit, integration, or regression tests with TestCodeWritingAgent when requested, approved, or required by the accepted plan.
- Prefer tests that capture intended behavior and important edge cases rather than implementation details.
- Run relevant verification with TestExecutionAgent when requested, approved, or required by the accepted plan.
- If the current safety net is already adequate, mark this stage not applicable and proceed without creating unnecessary tests.

Do not change production behavior merely to make a weak test pass.

**Outputs**

- New or updated characterization, unit, integration, or regression test cases when the safety net requires strengthening.
- Test execution results demonstrating the captured baseline behavior when execution is part of the approved work.
- Otherwise, a recorded not-applicable decision explaining why the existing safety net is adequate.

## Stage 5: Refactor Incrementally (Repeatable)

Implement the approved refactor in small increments with CodeWritingAgent.

For each increment:

1. Make one coherent structural improvement.
2. Preserve intended behavior and public interfaces unless an approved scope explicitly changes them.
3. Keep the change integrated and remove temporary compatibility code when it is no longer needed.
4. Perform the increment-level checks required by the plan or user request.
5. If verification exposes a defect, use BugFixingAndVerificationAgent and repeat the relevant check before continuing.

Repeat this stage for every planned increment. Expanded nested steps should show which increment is complete, current, or upcoming.

**Outputs**

- Integrated production-code changes for each approved refactor increment.
- Any directly required supporting code, configuration, comments, or interface documentation.
- Increment-level verification results and resolved defect fixes when those checks are part of the approved plan.

## Stage 6: Clean Up & Consolidate

After all refactor increments are stable, remove residue and make the result internally consistent.

- Remove dead code, obsolete helpers, stale comments, temporary adapters, and unnecessary duplication introduced or exposed by the refactor.
- Normalize names, module boundaries, imports, and documentation within the approved scope.
- Confirm that the refactored path is used from the relevant application entry points.
- Avoid unrelated cleanup that would broaden the review surface.

**Outputs**

- Consolidated production code with obsolete paths, temporary adapters, dead code, and in-scope duplication removed.
- Updated in-code and public-interface documentation affected by consolidation.
- A concise record of deferred cleanup that was intentionally excluded from scope.

## Stage 7: Full Verification

Verify the completed refactor at the appropriate scope.

- Run the relevant existing test suites, static checks, linting, type checks, builds, or targeted runtime verification when the user requested them or the accepted plan requires them.
- Compare results with the baseline and confirm that intended behavior and public interfaces remain intact.
- Use BugFixingAndVerificationAgent for refactor-related failures, then repeat the affected verification.
- Distinguish refactor regressions from pre-existing failures and report limitations accurately.

Do not claim successful verification for checks that were not executed.

**Outputs**

- Test, lint, static-analysis, type-check, build, or runtime-verification results for every check actually executed.
- Fixes and repeated verification results for refactor-related regressions.
- A verification summary that separates passing checks, pre-existing failures, new failures, skipped checks, and environmental limitations.

## Stage 8: Review & Close

Review the final result against the target defined in Stage 2.

- Confirm that the structural goal was achieved without unintended scope growth.
- Summarize the meaningful changes, verification performed, remaining risks, and any intentionally deferred work.
- Update affected documentation when the refactor changes architecture, maintenance guidance, or public interfaces.
- Use CodeReviewAgent when the user requests a code review or check-in summary.
- Close the workflow only after all applicable expanded steps and parent stages are complete or explicitly recorded as skipped.

**Outputs**

- A final completion summary mapping the implemented changes back to the refactor target and audit findings.
- A record of verification performed, residual risks, deferred findings, and any follow-up recommendations.
- Updated affected documentation and, when requested, a code-review report or check-in summary.

Throughout this workflow, preserve normal user approvals, interruption handling, cancellation behavior, service-configuration rules, and the three-attempt failure limit.
