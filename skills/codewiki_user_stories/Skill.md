---
name: codewiki_user_stories
description: Use ONLY when the user explicitly mentions "CodeWiki" and requests updates to the CodeWiki User Stories plane under kavia-docs/CodeWiki/UserStories/** (plus generated traceability backlinks); exclude generic user-story documentation requests.
owner: system
source_ecosystem: kavia-system
slash_command:
  command: codewiki-user-stories
  enabled: true
---

# codewiki_user_stories

=== CodeWiki User Stories Plane Maintenance Skill (Source-of-truth aligned with original UserStoryExtractionAgent prompt) ===

TRIGGER / ROUTING (STRICT)
- Use this skill ONLY when the user explicitly mentions "CodeWiki" (case-insensitive) AND the request is to create/update the CodeWiki User Stories plane (including traceability backlinks).
- If the user does NOT explicitly say "CodeWiki", DO NOT use this skill (even if they ask for "user stories", "write stories", "product stories in Markdown", etc.).
- For generic user-story documentation requests (not explicitly CodeWiki), use DocumentationAgent.

This skill is ONLY for extracting/updating the CodeWiki User Stories plane under:
- kavia-docs/CodeWiki/UserStories/**
- kavia-docs/CodeWiki/index.md (shared unified CodeWiki index)

It is NOT a generic “write user stories documentation” tool.

This skill extracts, normalizes, and maintains user stories as a parallel CodeWiki plane,
and maintains traceability from user stories → features (and optionally capabilities),
WITHOUT modifying the feature hierarchy structure itself.

HARD OUTPUT CONTRACT (CRITICAL)
- Write user story files ONLY under:
  - kavia-docs/CodeWiki/UserStories/**
  - and the shared unified CodeWiki index: kavia-docs/CodeWiki/index.md
- Maintain the User Stories index at:
  - kavia-docs/CodeWiki/UserStories/index.md
- Do NOT invent features or capabilities.
- Do NOT modify the feature hierarchy structure (areas/features/capabilities/behaviors) owned by the features plane.
- Do NOT modify architecture IR or architecture docs.
- Cross-plane edits are allowed ONLY inside clearly marked GENERATED blocks owned by this skill.

1) SCOPE OF USER STORY EXTRACTION
You MAY extract user stories from:
- Product requirements, epics, or tickets
- README and onboarding docs
- Test specifications (BDD/Gherkin/acceptance-style tests)
- CLI flows and usage docs
- Repeated runtime/workflow patterns that clearly imply user intent

Prefer explicit stories. You MAY infer stories only when:
- intent is clear and repeated
- inferred story maps cleanly to existing features/capabilities

INFERENCE POLICY (MANDATORY)
- If request_details.user_stories.allowInference is false: do not add inferred stories.
- If inference is used:
  - tag the story with "inferred" in front matter tags.

2) DIRECTORY AND FILE STRUCTURE (MANDATORY)
All generated documents MUST live under kavia-docs/CodeWiki/UserStories/:

- User story index:
  - kavia-docs/CodeWiki/UserStories/index.md
- Individual user stories:
  - kavia-docs/CodeWiki/UserStories/<story-id>.md

3) STORY ID RULES (MANDATORY)
- <story-id> MUST be stable kebab-case.
- If no explicit ID exists, derive from story name:
  1) lowercase
  2) replace spaces/punctuation with '-'
  3) collapse multiple dashes
  4) trim leading/trailing dashes
- Use the derived ID consistently in:
  - YAML front matter id
  - filename
  - all links

4) YAML FRONT MATTER (MANDATORY)
Each user story Markdown file MUST begin with YAML front matter delimited by '---'.

User Story Front Matter Schema (minimum required keys):
- id: string, required
- type: string, exactly "user-story"
- name: string, required
- persona: string, required (use "unknown" if not inferable)
- status: optional (active/draft/deprecated)
- priority: optional (high/medium/low)
- epic: optional string
- related_features: YAML list of feature ids (use [] if none)
- related_capabilities: YAML list of capability ids (use [] if none)
- tags: YAML list (use tags: [] if empty)
- version: optional

5) BODY STRUCTURE (MANDATORY)
Each user story file MUST contain:
1) Front matter
2) Breadcrumb line
3) H1 with story name
4) Standardized story content sections (as available)

Content quality baseline (recommended for consistency):
- Include an explicit "As a … I want … so that …" statement, even if derived/inferred (keep it crisp).
- Prefer Acceptance Criteria bullets or Gherkin-like bullets when available.
- Include a "## Related" or "## See also" section linking to:
  - User Stories index
  - related features/capabilities (where links exist)
  - (optional) impacted architecture pointers when clear (no cross-plane edits required)

Breadcrumb requirements for CodeWiki user stories:
- Breadcrumb MUST link to unified CodeWiki index and User Stories index.
- Example pattern (compute relative paths correctly for current file location):
  [CodeWiki](../index.md) / [User Stories](index.md)

6) CROSS-REFERENCE UPDATES (MANDATORY TRACEABILITY BACKLINKS)
You MUST update related feature pages (and optionally capability pages) to include backlinks to user stories
inside clearly marked generated sections.

Generated block format (MUST match exactly):
## Related User Stories
<!-- GENERATED: user-stories -->

- [Story Name](../../UserStories/story-id.md)

<!-- END GENERATED -->

Rules:
- Only modify content inside the GENERATED block. Do not touch manual text outside it.
- Backlink targets:
  - Feature pages:
    kavia-docs/CodeWiki/Features/features/<feature-id>.md
  - Capability pages ONLY if request_details.user_stories.traceability == "features_and_capabilities":
    kavia-docs/CodeWiki/Features/capabilities/<capability-id>.md
- Use relative links that are correct from the feature/capability file location to the story file.

7) DEFENSIVE RULES
- Do NOT invent new features/capabilities to “fit” stories.
- Keep IDs stable across runs.
- Use relative links only.
- Write files ONLY under kavia-docs/CodeWiki/UserStories/ (except generated backlink blocks in features plane as specified).

8) COMPLETION, TRACEABILITY VALIDATION, AND WORKFLOW HANDOFF

Complete only the bounded User Stories objective assigned by the workflow. Do not
run an internal loop, require fixed phases, or emit a private state protocol.

8.1) OBSERVABLE COMPLETION CRITERIA
- `UserStories/index.md` links every selected story, and each linked story page
  exists with stable front matter and the required story structure.
- Every `related_features` and `related_capabilities` identifier refers to an
  existing selected dependency or is reported as unresolved; never invent a
  Feature or Capability to close a reference.
- Each applicable Feature backlink GENERATED block agrees with the story's
  `related_features` list.
- Capability backlinks agree with `related_capabilities` when
  `traceability == "features_and_capabilities"`.
- Breadcrumbs and relative links resolve from the containing file's directory.
- Manual text outside owned GENERATED blocks and all out-of-scope planes remain
  unchanged.
- Inferred stories comply with `allowInference` and carry the `inferred` tag.

8.2) Dependency and defect handling
- Features must be materialized and readable before creating or validating
  traceability when that dependency applies.
- Seeded defects such as a stale Feature ID, one-sided backlink, broken story index
  link, missing GENERATED block, or incorrect breadcrumb must be repaired when
  concrete and within scope.
- If a required Feature or Capability dependency is absent or was intentionally discarded,
  stop that dependent repair and report the exact conflict rather than broadening
  scope or recreating the dependency.

8.3) Ordinary workflow handoff
- Finish with ordinary Markdown reporting the stage outcome, bounded objective,
  changed story and backlink artifacts, validation evidence, unresolved references,
  blockers, and recommended next action.
- Recommend continuation only when required remaining traceability work is
  concrete, bounded, and another invocation is likely to produce material progress.
- Do not emit `PASS_STATE`, pass names, iteration counters, or fixed story-count
  thresholds.

9) MARKDOWN STRUCTURE AND MKDOCS RENDERING RULES (MANDATORY)
These rules exist to prevent malformed Markdown that renders poorly in MkDocs. Follow them strictly.

9.1) Headings (strict)
- Exactly one H1 per user story page and it MUST be the story name.
- Do NOT skip heading levels:
  - H1 (#) → H2 (##) → H3 (###)
  - Never jump from H1 directly to H3.
- Do not create “inline headings” like:
  - "## Acceptance Criteria: ..." or "## Related: ..." (FORBIDDEN)
  Use plain titles ("## Acceptance Criteria", "## Related") and put content below.

Recommended H2 sections (include only when content exists; do not create empty headings):
- ## Story
- ## Acceptance Criteria
- ## Notes
- ## Related
- ## References

9.2) Blank lines (strict)
- YAML front matter must be followed by:
  - Breadcrumb line
  - blank line
  - H1
  - blank line
- Always include ONE blank line:
  - before every heading
  - after every heading
  - before and after every bullet list
  - between consecutive lists and paragraphs
- Do not place list items immediately after a colon without a blank line.

9.3) Lists (strict)
- Use "-" bullet lists only (not "*" or "+") for consistency.
- Acceptance criteria MUST be a bullet list when multiple criteria exist.
- Each list item MUST be on its own line.
- Do NOT “flatten” multiple acceptance criteria into a single sentence or paragraph.
  FORBIDDEN examples:
  - "Acceptance criteria include A, B, C." (FORBIDDEN)
  - "- A - B - C" (FORBIDDEN)
  - "- A; B; C" (FORBIDDEN)

9.4) Prohibited “flattened inline prose” patterns (FORBIDDEN)
To ensure MkDocs renders cleanly, do NOT output:
- Entire-page prose with no headings beyond the H1.
- Headings immediately followed by another heading (empty section).
- “Sentence soup” that embeds multiple subsections inline, e.g.:
  - "## Acceptance Criteria A: ... B: ... C: ..." (FORBIDDEN)
- Multiple conceptual sections merged into a single paragraph (e.g., story statement + acceptance criteria + related links all combined).

9.5) Link formatting (strict)
- Links must be standard Markdown links: [Text](relative/path.md)
- No HTML anchors, no raw URLs, no absolute filesystem paths, and no leading '/'.
- Compute relative paths correctly.

If you are modifying an existing file that violates these rules, refactor its Markdown structure to comply while preserving IDs and meaning.
