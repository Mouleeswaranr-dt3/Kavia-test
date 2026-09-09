---
name: codewiki_features
description: Use ONLY when the user explicitly mentions "CodeWiki" and requests updates to the CodeWiki Features plane under kavia-docs/CodeWiki/Features/**; exclude generic feature/capability/behavior documentation requests.
owner: system
source_ecosystem: kavia-system
slash_command:
  command: codewiki-features
  enabled: true
---

# codewiki_features

=== CodeWiki Features Plane Maintenance Skill (Source-of-truth aligned with original FeatureExtractionAgent prompt) ===

TRIGGER / ROUTING (STRICT)
- Use this skill ONLY when the user explicitly mentions "CodeWiki" (case-insensitive) AND the request is to create/update the CodeWiki Features plane.
- If the user does NOT explicitly say "CodeWiki", DO NOT use this skill (even if they ask for "feature documentation", "capabilities list", "Markdown documentation", etc.).
- For generic feature/capability/behavior documentation requests (not explicitly CodeWiki), use DocumentationAgent.

This skill is ONLY for generating/updating the CodeWiki Features plane content under:
- kavia-docs/CodeWiki/Features/**
- kavia-docs/CodeWiki/index.md (shared unified CodeWiki index)

It is NOT a general-purpose documentation writer.

This skill generates and maintains the "Features plane" of the CodeWiki as a Markdown-first hierarchy with stable IDs and linked navigation.

HARD OUTPUT CONTRACT (CRITICAL)
- Write ONLY under:
  - kavia-docs/CodeWiki/Features/** (this plane)
  - kavia-docs/CodeWiki/index.md (shared unified CodeWiki index)
- Do NOT write to legacy non-CodeWiki locations (e.g., kavia-docs/features/**). This skill is CodeWiki-scoped by design.
- Use relative Markdown links only (GitHub/VSC/MkDocs compatible). Never use absolute filesystem paths or leading '/'.
- Use stable kebab-case ids and filenames; keep ids stable across runs. If an entity already has an id, DO NOT change it.
- Do NOT hardcode or assume any specific navigation tree beyond what is explicitly provided at runtime.
- Rely on dynamically injected navigation guidance (e.g., injected folder/index pointers, breadcrumb/link patterns, and any provided “nav guidance” block) to determine the correct structure and linking.
- Maintain parent→child lists as instructed by the injected nav guidance for this run (e.g., ensure parents link to children and indexes/breadcrumbs are consistent per the provided guidance).
- Every Markdown document produced/updated by this skill MUST include YAML Front Matter (see below), except where explicitly stated otherwise.

1) DIRECTORY AND FILE STRUCTURE (MANDATORY)
- Features plane index:
  - kavia-docs/CodeWiki/Features/index.md
- Product Area pages:
  - kavia-docs/CodeWiki/Features/areas/<area-id>.md
- Feature pages:
  - kavia-docs/CodeWiki/Features/features/<feature-id>.md
- Optional Capability pages (ONLY when the capability has enough substantive,
  independently useful content to justify a page):
  - kavia-docs/CodeWiki/Features/capabilities/<capability-id>.md
- Optional Behavior pages (ONLY if behavior_mode allows standalone pages):
  - kavia-docs/CodeWiki/Features/behaviors/<behavior-id>.md

CONSOLIDATION PRINCIPLE (MANDATORY)
- Optimize for a small set of useful, information-dense pages rather than one
  file per extracted hierarchy node.
- Product Areas and Features are the default page boundaries.
- Capabilities MUST be documented inline in their parent Feature page unless
  they satisfy the standalone-page criteria in section 7.
- Behaviors MUST be documented inline under their capability unless
  behavior_mode explicitly allows a justified standalone page.
- Do not create placeholder, stub, title-only, metadata-only, or near-empty
  Capability/Behavior pages merely to mirror the extracted hierarchy.
- Stable capability and behavior IDs remain required even when those entities
  are inline; include them in labeled content.

ID AND FILENAME RULES (MANDATORY)
- <area-id>, <feature-id>, <capability-id>, <behavior-id> are stable IDs.
- Filenames MUST be kebab-case versions of the ids:
  - id: repo-search → features/repo-search.md
- If no explicit id exists but a stable name exists, derive id from name:
  1) lowercase
  2) replace spaces/punctuation with '-'
  3) collapse multiple dashes
  4) trim leading/trailing dashes
- Use the derived id consistently in:
  - YAML front matter id field
  - filename
  - all links

2) YAML FRONT MATTER (MANDATORY, BACKWARD-COMPATIBLE)
Each Markdown file you create or update MUST start with YAML front matter delimited by '---' lines.

General rules:
- Preserve any existing front matter keys that may be used by downstream loaders.
- When updating an existing file:
  - Do NOT remove or rename existing id/parent/version metadata.
  - You MAY add 'type' if missing.
  - Ensure 'tags' is a YAML list (use tags: [] if empty).

2.1) Product Area front matter (areas/<area-id>.md)
Required keys:
- id: string, required
- name: string, required (fallback: use id if unknown)
- type: string, exactly "area"
- description: optional string
- tags: YAML list (tags: [] if empty)
- version: optional

2.2) Feature front matter (features/<feature-id>.md)
Required keys:
- id: string, required
- name: string, required
- type: string, exactly "feature"
- area_id: string, required (parent area id)
- description: optional string
- tags: YAML list
- version: optional

2.3) Capability front matter (capabilities/<capability-id>.md, standalone pages only)
Required keys:
- id: string, required
- name: string, required
- type: string, exactly "capability"
- feature_id: string, required (parent feature id)
- description: optional string
- tags: YAML list
- version: optional

2.4) Behavior front matter (behaviors/<behavior-id>.md) (ONLY if standalone pages exist)
Required keys:
- id: string, required
- name: string, required
- type: string, exactly "behavior"
- capability_id: string, required (parent capability id)
- description: optional string
- tags: YAML list
- version: optional

3) LINKED NAVIGATION REQUIREMENTS (INDEXES + CHILD LISTS)
You MUST maintain linked navigation such that users can traverse the hierarchy.

CRITICAL LINK OUTPUT REQUIREMENT (FOR RENDERED HTML)
- Any time you mention a Feature, Capability, or Behavior as a navigational element (especially on Product Area pages), you MUST use a real Markdown hyperlink:
  - Correct: [Repository Detail](../features/repository-detail.md)
  - Incorrect (FORBIDDEN): "Repository Detail" (plain text with no link)
  - Incorrect (FORBIDDEN): "Repository Detail - Capabilities: ..." where "Repository Detail" is not a Markdown link
- The parent→child lists MUST be made of Markdown bullet links only. Do not emit child lists as numbered prose or paragraphs.
- If a target page does not exist yet, you MUST create it in the same iteration (bounded by controller limits) so the link resolves, or omit the mention.

3.1) Features plane root index (kavia-docs/CodeWiki/Features/index.md)
MUST contain:
- YAML front matter (type should be "features-index" or similar)
- H1 heading: "# Features"
- short descriptive paragraph
- bullet list of ALL product areas, each linking to its area page using relative links from Features/index.md:
  - [Area Name](areas/<area-id>.md)

3.2) Area pages list child Features
Each area page MUST include:
- front matter
- breadcrumb line (see section 4)
- H1 with area name
- "## Features" section listing ALL features belonging to this area (no omissions):
  - [Feature Name](../features/<feature-id>.md)

3.3) Feature pages document child Capabilities
Each feature page MUST include:
- front matter
- breadcrumb line
- H1 with feature name
- "## Capabilities" section covering ALL capabilities belonging to this feature.

Default consolidated pattern:
- Represent each capability as an H3 subsection within the Feature page.
- Include at minimum:
  - **Code:** <capability-id>
  - a substantive description of scope and user value
  - known behaviors, evidence, constraints, or operational details
- Keep related small capabilities together on the same Feature page rather than
  manufacturing separate pages.

Standalone capability pattern:
- If a capability meets section 7's standalone-page criteria, list it as a
  Markdown bullet link:
  - [Capability Name](../capabilities/<capability-id>.md)
- Do not create a standalone target merely because the extracted model contains
  a capability node.
- A Feature page may mix inline capability subsections and links to substantive
  standalone capability pages.

3.4) Capability content documents Behaviors
Each inline capability subsection or justified standalone capability page MUST
include its known behaviors.

Standalone capability pages MUST include:
- front matter
- breadcrumb line
- H1 with capability name
- "## Behaviors" section

Allowed behavior patterns:
A) Linked behaviors (standalone pages exist):
- bullet list with links:
  - [Behavior Name](../behaviors/<behavior-id>.md)

B) Inline behaviors (default):
- On a standalone Capability page, use H3 sections per behavior.
- Under an inline H3 Capability subsection on a Feature page, use H4 sections
  per behavior so heading levels are not skipped.
- Include at minimum:
  - **Code:** <behavior-id or stable code>
  - **Description:** ...
  - Triggers / Steps / Acceptance Criteria (as available)
  - Metrics (optional)

You may mix linked and inline behaviors if needed. However:
- Default is to keep behaviors inline unless behavior_mode allows standalone pages.
- Even if there are no known behaviors, keep a "## Behaviors" section with a short statement.

3.5) Standalone Behavior pages (optional)
If behavior pages are created, each MUST include:
- front matter with capability_id
- breadcrumb line linking back up the full chain (Product Areas → Area → Feature → Capability)
- H1 with behavior name
- "## Parent" section linking to its capability:
  - [Capability: <capability name>](../capabilities/<capability-id>.md)

4) BREADCRUMBS (MANDATORY)
Every page MUST include a breadcrumb line immediately after front matter and before the H1 heading,
EXCEPT for the plane root index (Features/index.md), which may omit breadcrumb but MUST still include front matter.

Breadcrumb requirements for CodeWiki:
- Breadcrumb MUST include a link back to the unified CodeWiki index:
  - From any file under kavia-docs/CodeWiki/Features/**:
    [CodeWiki](../index.md) OR appropriate relative path when nested
- Breadcrumb MUST include a link back to the Features plane index:
  - [Features](index.md) from within Features/
  - Or relative equivalent from nested subfolders

Concrete breadcrumb patterns (compute relative paths correctly):
- For Features/areas/<area-id>.md:
  [CodeWiki](../index.md) / [Features](index.md)
- For Features/features/<feature-id>.md:
  [CodeWiki](../index.md) / [Features](index.md) / [Area Name](areas/<area-id>.md)
- For Features/capabilities/<capability-id>.md:
  [CodeWiki](../index.md) / [Features](index.md) / [Area Name](areas/<area-id>.md) / [Feature Name](features/<feature-id>.md)
- For Features/behaviors/<behavior-id>.md (if present):
  [CodeWiki](../index.md) / [Features](index.md) / [Area Name](areas/<area-id>.md) / [Feature Name](features/<feature-id>.md) / [Capability Name](capabilities/<capability-id>.md)

IMPORTANT:
- Breadcrumb links MUST be relative and correct from the current file location.
- Breadcrumb is a single line with segments separated by " / ", followed by a blank line, then H1.

5) RELATIVE LINKS AND FILENAMES (MANDATORY POLICY)
- Use only relative links (no absolute paths).
- Use kebab-case filenames derived from IDs.
- When updating legacy/nonconforming files inside CodeWiki, preserve the existing id in front matter and ensure links target filenames consistent with that id.

6) MINIMUM CONTENT BODY STRUCTURE (PER PAGE)
- Exactly one H1 per page.
- Do not skip heading levels.
- Content quality baseline (recommended for consistency):
  - Immediately after H1, include a short overview paragraph describing scope and user value.
  - Include a "## Related" or "## See also" section near the end with links upward/siblings (relative links only).

Minimum required sections per type:
- Area page:
  - H1
  - short description paragraph
  - ## Features (complete list of links to feature pages)
  - (recommended) ## Related / ## See also
- Feature page:
  - H1
  - short description paragraph
  - ## Capabilities (complete coverage using inline H3 subsections and/or links
    to justified standalone capability pages)
  - (recommended) ## Related / ## See also
- Capability page (only when justified by section 7):
  - H1
  - short description paragraph
  - ## Behaviors (linked and/or inline)
  - (recommended) ## Related / ## See also
- Behavior page (if created):
  - H1
  - ## Parent (link)
  - optional: Triggers, Steps, Acceptance Criteria, Metrics
  - (recommended) ## Related / ## See also

7) CAPABILITY AND BEHAVIOR CONSOLIDATION POLICY (REQUEST OVERRIDES)
- Default capability_mode is inline_preferred.
- Under inline_preferred, create a standalone Capability page only when at least
  one of these evidence-based conditions is true:
  - the capability has multiple substantive behaviors with enough detail that
    keeping them on the Feature page would make that page difficult to scan;
  - it has substantial independent workflows, configuration, constraints,
    examples, failure modes, or implementation evidence;
  - it is reused by or meaningfully related to multiple Features and needs one
    canonical explanation;
  - an existing substantive Capability page must be preserved and updated;
  - the user or runtime request explicitly requires a standalone page.
- A name, one-sentence description, stable ID, or parent-child relationship
  alone is NOT sufficient justification for a standalone Capability page.
- If the available evidence would produce only front matter, a heading, a short
  description, and a child list, keep the capability inline.
- When several related capabilities are individually small, consolidate them
  as H3 subsections in one Feature page.
- request_details.features.capability_mode may override:
  - inline_preferred: apply the consolidation rules above.
  - allow_standalone_pages: standalone pages MAY be created, but only when they
    are substantive and independently useful.

- Default behavior_mode is inline_only.
- request_details.features.behavior_mode may override:
  - inline_only: do not create behaviors/*.md pages; behaviors are inline in capability pages.
  - allow_standalone_pages: behaviors/*.md pages MAY be created when beneficial; ensure breadcrumbs and parent links.

8) REQUIRED INVENTORY, COMPLETION, AND WORKFLOW HANDOFF

Complete only the bounded Features objective assigned by the workflow. Do not run
an internal loop, require fixed phases, or emit a private state protocol. For this
plane, completion means the selected hierarchy is covered by a compact,
navigable set of substantive pages and resolving links, not a one-file-per-node
projection or only a narrative summary.

8.1) REQUIRED CONTENT INVENTORY (MANDATORY, CONSOLIDATION-AWARE)
This plane is considered structurally created only when the following content
exists:

The plane root index:
- kavia-docs/CodeWiki/Features/index.md

For every Product Area referenced by the plane index:
- kavia-docs/CodeWiki/Features/areas/<area-id>.md

For every Feature referenced by any area page:
- kavia-docs/CodeWiki/Features/features/<feature-id>.md

For every Capability belonging to a selected Feature:
- the capability is documented as an H3 subsection in its parent Feature page; OR
- a substantive standalone page exists at
  kavia-docs/CodeWiki/Features/capabilities/<capability-id>.md and the Feature
  page links to it.

Important clarification:
- Listing Features as subheadings within an Area page is not acceptable as a
  substitute for Feature pages.
- Listing Capabilities as substantive H3 subsections within a Feature page is
  the preferred default and is not an incomplete hierarchy.
- Area pages must list Features as links. Feature pages must cover every
  Capability inline or link to a justified standalone page.

If the bounded stage cannot complete the full selected inventory:
- create substantive Feature pages and consolidate currently sparse Capability
  content into them;
- do not create Capability or Behavior stubs;
- omit unresolved links and report the exact missing inventory in the ordinary
  workflow handoff. Ordinary workflow handoff reporting must identify the exact
  missing inventory without introducing a private state protocol.

8.2) PROHIBITED PAGE-FAN-OUT AND INLINE PATTERNS (STRICT)
The following patterns are forbidden:
- An Area page containing multiple "### <Feature>" sections instead of linking
  to separate Feature pages.
- A standalone Capability or Behavior page containing little more than front
  matter, a title, one sentence, and parent/child navigation.
- Creating files for every extracted node without evaluating whether each file
  provides independently useful content.

If you detect inline Features on an Area page, refactor them into:
- area page → bullet links to feature pages
- feature page → consolidated capability subsections and, only where justified,
  links to substantive capability pages

If you detect sparse existing Capability pages:
- preserve their stable IDs;
- merge their useful content into the parent Feature page;
- update links to target the consolidated Feature page;
- remove sparse pages when no inbound link or independent content justifies them.

8.3) OBSERVABLE COMPLETION CRITERIA
- The Features index lists every selected Product Area as a resolving Markdown link.
- Every selected Area lists all known child Features, and every linked Feature page
  exists with the required stable ID and `area_id`.
- Every selected Feature covers all known child Capabilities inline or links to
  justified standalone Capability pages with stable IDs and `feature_id`.
- Every selected Capability documents known behaviors inline or through
  justified standalone Behavior pages whose links resolve.
- No standalone Capability or Behavior page exists only for structural symmetry.
- Parent-child identifiers, filenames, breadcrumbs, and relative links agree
  throughout the selected hierarchy.
- Existing IDs and generated-region ownership are preserved.
- Missing evidence or incomplete inventory is reported precisely without inventing
  entities or broadening into another plane.

8.4) VALIDATION AND ORDINARY WORKFLOW HANDOFF
- Inspect the selected hierarchy from index to leaf and validate each changed link
  from the containing page's directory.
- Identify near-empty Capability and Behavior pages and consolidate their useful
  content into parent Feature pages when manual content will not be lost.
- Confirm that seeded defects such as a missing child page, stale identifier,
  incorrect breadcrumb, or broken parent-child link are repaired or explicitly
  reported.
- Finish with ordinary Markdown reporting the stage outcome, bounded objective,
  changed artifacts, validation evidence, remaining inventory, blockers, and
  recommended next action.
- Recommend continuation only when required missing inventory is concrete, bounded,
  and another invocation is likely to create material artifact progress.
- Do not emit `PASS_STATE`, pass names, iteration counters, or fixed page-count
  thresholds.

9) DEFENSIVE RULES
- Keep IDs stable across runs; do not arbitrarily rename.
- Avoid empty headings; only add headings when content exists (except required child list sections and required Behaviors section).
- tags MUST be a YAML list.
- Do not invent architecture or user stories here; this skill owns the features plane only.

10) MARKDOWN STRUCTURE AND MKDOCS RENDERING RULES (MANDATORY)
These rules exist to prevent malformed Markdown that renders poorly in MkDocs. Follow them strictly.

10.1) Headings (strict)
- Exactly one H1 per page and it MUST be the entity name:
  - Area page: H1 = Area name
  - Feature page: H1 = Feature name
  - Capability page: H1 = Capability name
  - Behavior page (if present): H1 = Behavior name
- Do NOT skip heading levels:
  - H1 (#) → H2 (##) → H3 (###)
  - Never jump from H1 directly to H3.
- Required H2 sections (must exist verbatim as specified earlier in this prompt):
  - Area: "## Features"
  - Feature: "## Capabilities"
  - Capability: "## Behaviors"

10.2) Blank lines (strict)
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
- Do not place list items immediately after a colon without a blank line. Use:
  - "## Capabilities"
  - blank line
  - list items

10.3) Lists (strict)
- Child navigation lists MUST be Markdown bullet lists using "-" only (not "*" or "+") for consistency.
- Each navigational list item MUST be on its own line and contain exactly one
  link for the child entity:
  - "- [Capability Name](../capabilities/<capability-id>.md)"
- This rule applies only when the child has a standalone page. Inline
  Capabilities are H3 subsections, not forced links or files.
- Do NOT “flatten” multiple children into a single paragraph like:
  - "Capabilities include A, B, C" (FORBIDDEN)
  - "- A - B - C" (FORBIDDEN)
  - "- [A](...) [B](...) [C](...)" (FORBIDDEN)
- Do not wrap list items across multiple lines unless using proper indentation (avoid if possible).

10.4) Subsections for inline behaviors (required formatting)
When using inline behaviors under "## Behaviors":
- Use "### <Behavior Name>" for each behavior (H3), not bold-only or inline labels.
- When behaviors are nested under an inline "### <Capability Name>" subsection
  on a Feature page, use "#### <Behavior Name>" for each behavior.
- Under each behavior H3, use short, consistently labeled fields as plain paragraphs, each starting on a new line, e.g.:
  - "**Code:** <behavior-id>"
  - "**Description:** ..."
- Keep field blocks as paragraphs (not a single run-on line with many semicolons).

10.5) Prohibited “flattened inline prose” patterns (FORBIDDEN)
To ensure MkDocs renders cleanly, do NOT output:
- Entire-page prose with no headings beyond the H1.
- Headings immediately followed by another heading (empty section).
- “Sentence soup” that embeds multiple subsections inline, e.g.:
  - "## Behaviors Behavior A: ... Behavior B: ... Behavior C: ..."
- Multiple conceptual sections merged into a single paragraph (e.g., description + child list + related links all in one paragraph).

10.6) Link formatting (strict)
- Links must be standard Markdown links: [Text](relative/path.md)
- No HTML anchors, no raw URLs, no absolute filesystem paths, and no leading '/'.

If you are modifying an existing file that violates these rules, refactor its Markdown structure to comply while preserving IDs and meaning.
