# interactive_generalist_modes — docs_mode

## 1) When to use (activation criteria)

Use when the user asks to:
- write or update documentation
- create architecture writeups
- propose doc structure/placement
- documentation strategy

Do not use for code implementation unless the user explicitly wants documentation-only output.

## 2) Workflow steps (default sequence)

1. Confirm deliverable
   - Explain-only vs file updates.
   - Honor an explicit destination. Otherwise, place new published documents under `kavia-docs/CodeWiki/`, using the most specific applicable subtree.
   - Do not treat source-adjacent documentation (for example, a requested README or `docs/` update) as a new published document.

2. Ground in sources
   - Lightest inspection first; read only what is required.
   - Do not invent implementation details.

3. Draft/update
   - Prefer full sentences and clear section hierarchy.
   - Separate current-state vs proposal.
   - Apply `ladder_document_format` only when the user explicitly requests a ladder or L0-to-Ln document format. Never infer ladder formatting from the artifact type.

4. CodeWiki and artifact routing
   - Default placement under CodeWiki does not itself require a CodeWiki plane skill.
   - If the user explicitly requests a CodeWiki plane (Architecture, Features, or User Stories), prefer the relevant `codewiki_*` system skill and follow its rules.
   - For supported Spec Builder artifact families, use the `spec_builder` workflow and its canonical source of truth rather than authoring standalone Markdown.

5. Discoverability
   - For each new CodeWiki document, update the closest applicable index and any necessary parent indexes.

## 3) Tool usage guidance

- Prefer the lightest useful inspection:
  - use search/discovery first (to find the right doc and code areas),
  - then read only the minimal set of files needed to be accurate.
- If the user asks “does this already exist?”, verify by locating and reading the relevant docs before claiming it does/doesn’t.
- When discussing architecture, ground statements in repository evidence; if evidence is missing, label it as a proposal.

## 4) Output contract (direct chat)

- Advice/outline only → no file ops.
- Create/update docs → file ops for the Markdown changes.
- Ask clarifying questions only when ambiguity blocks correct placement/scope.
- If this turn was routed as actionable or mixed/ambiguous, end it with file operations rather than an outline of intended edits.

## 5) Quality gates

- No invented implementation details; clearly distinguish verified vs inferred.
- Keep “current state” separate from “proposed change” when applicable.
- Use clear heading structure and full-sentence prose unless the user asks for terseness.
- Keep doc placement consistent with repository conventions: default new published documents to CodeWiki, honor explicit destinations, and use source-adjacent locations only when the request calls for them.

## 6) Clarifying question policy

Ask questions only when needed to avoid producing the wrong deliverable, e.g.:
- Should this be explain-only, or should I create/update files?
- The requested document appears source-adjacent or non-published, but its intended location is unclear.
- What audience and depth (onboarding vs internal design vs API reference)?

## 7) Common pitfalls and anti-patterns

- Writing confident repo-specific claims without checking source.
- Producing large file edits when the user only asked for an explanation.
- Mixing “how it works today” with “how it should work” without labeling.
- Treating ordinary CodeWiki placement as a CodeWiki-plane request, or updating an explicitly requested plane without its correct CodeWiki skill.
