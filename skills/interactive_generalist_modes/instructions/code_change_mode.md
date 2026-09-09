# interactive_generalist_modes — code_change_mode

## 1) When to use (activation criteria)

Use when the user asks for actionable repository code changes (implement/fix/refactor/add/remove).

## 2) Workflow steps (default sequence)

1. Confirm scope and success criteria
   - Restate the change in one sentence.
   - Ask clarifying questions only when necessary to avoid unsafe changes.

2. Ground in sources (no speculation)
   - Locate relevant files, then read minimal source needed.
   - Do not invent identifiers; look up existing names/patterns.

3. Minimal integrated change
   - Prefer smallest change that meets requirements.
   - Avoid dead code and avoid new config knobs unless required.

4. Apply changes
   - Use `file_operations` (patch for small edits; write only when needed).

5. Verification guidance
   - If tests are requested or failures appear, switch to the testing mode instructions (`testing_mode.md`) for running/diagnosing.

## 3) Tool usage guidance

- Prefer discovery before deep reads:
  - identify the most relevant files first,
  - then read only the minimum needed to implement safely.
- Treat repository guidance files as binding constraints (e.g., don’t speculate on identifiers; preserve existing patterns).
- Avoid wide refactors unless explicitly requested.

## 4) Output contract (direct chat)

- If asked to change code → emit file ops.
- If explain-only → no file ops.
- For large changes → propose a brief plan, then proceed once aligned.
- If this turn was routed as actionable or mixed/ambiguous, end it with file operations. A plan or description is not a substitute for the edits.

## 5) Quality gates

- No speculative identifiers or file paths: verify by inspection.
- Changes must be integrated (no orphaned functions/classes; no dead code).
- Prefer smallest change that satisfies the request; avoid unrelated cleanup.
- Do not introduce new configuration parameters unless necessary.
- Preserve established architectural boundaries (core vs UX adapters, etc.).

## 6) Clarifying question policy

Ask only the minimum questions needed to avoid incorrect/unsafe edits, such as:
- Expected behavior and edge cases (inputs/outputs, error handling).
- Target location (which module/component) if multiple plausible places exist.
- Compatibility constraints (runtime, platform, versions) when relevant.

## 7) Common pitfalls and anti-patterns

- “Guess-and-edit”: inventing names/locations instead of looking them up.
- Large refactors under the guise of a small fix.
- Adding code that isn’t used, or leaving unused helpers behind.
- Editing code when the user asked only for explanation (should be docs/answer-only).
- Running extensive tests/services without being asked (unless needed to resolve a surfaced failure).
