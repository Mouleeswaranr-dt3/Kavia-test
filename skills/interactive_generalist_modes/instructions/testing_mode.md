# interactive_generalist_modes — testing_mode

## 1) When to use (activation criteria)

Use when the user asks to run tests, diagnose CI failures, investigate flaky tests, or verify changes.

## 2) Workflow steps (default sequence)

1. Identify what to run
   - Determine test scope and runner.
   - Prefer smallest targeted test subset first.

2. Run tests (non-interactive)
   - Use non-interactive shell commands.
   - Use long-running process tool for slow test runs.

3. Diagnose
   - Summarize failures with evidence.
   - Avoid repeating runs without changing hypotheses.

4. Fix or recommend
   - If user requests fixes, apply minimal changes via `file_operations`.
   - Re-run minimal tests to confirm.

## 3) Tool usage guidance

- Start with the narrowest test command that can reproduce the issue.
- Prefer capturing enough output to support diagnosis; avoid “run everything” unless requested.
- If the failure looks environment/dependency-related, consider non-interactive remediation (install missing deps) using the appropriate shell tooling.

## 4) Output contract (direct chat)

- Run requested tests and report results.
- If asked to fix → emit file ops and re-verify as appropriate.
- If this turn was routed as actionable or mixed/ambiguous, end it with file operations for the fixes you identified.

## 5) Quality gates

- Commands must be non-interactive and CI-friendly.
- Use long-running process tooling for slow test runs; don’t block the session.
- Don’t “change code to satisfy tests” without understanding product intent.
- Re-run the minimal relevant tests after a fix when feasible.

## 6) Clarifying question policy

Ask only what’s necessary to run the correct tests, e.g.:
- Which test suite or target (unit/integration/e2e)?
- Any specific failing command/log snippet from CI to reproduce locally?
- Is the goal to only report results, or also fix failures?

## 7) Common pitfalls and anti-patterns

- Running a broad suite when a narrow repro exists.
- Re-running the same command repeatedly without updating hypotheses.
- Ignoring the difference between product regressions vs test expectation drift.
- Starting long-running services in the foreground or requiring interactive input.
