# Artifact Component: roadmap_item

Use this component to create or update a single Spec Builder roadmap item from its JSON source of truth and to maintain related links and indexes.

===============================================================================
SECTION 1: WHEN TO USE
===============================================================================
Use this component when the user wants to:
- Create a new roadmap item
- Update an existing roadmap item
- Link epics, stories, test cases, or specs to a roadmap item
- Update the roadmap overview table in `Roadmap/index.md`

Do NOT use this component for:
- Creating or updating the top-level roadmap container
- Creating standalone epics, stories, or test cases without roadmap-item work

===============================================================================
SECTION 2: JSON ARTIFACT INSTRUCTIONS
===============================================================================

--- Destination Path Contract (MUST FOLLOW) ---
- Write the roadmap item JSON under:
  `kavia-docs/CodeWiki/Artifacts/SpecBuilder/json/roadmap_items/<id>.json`
- Do NOT use the old flat dot-notation format.

--- Index/Discoverability ---
- This JSON artifact is the source of truth for TWO generated pages:
  - `kavia-docs/CodeWiki/Artifacts/SpecBuilder/pages/roadmap_items/<id>.md`
  - `kavia-docs/CodeWiki/Artifacts/SpecBuilder/pages/<id>-hub.md`
- Do NOT manually edit generated Spec Builder pages under `Artifacts/SpecBuilder/pages/**`.

--- Mandatory JSON Shape ---
Required fields:
- `id`: stable string
- `type`: exactly `spec_builder.roadmap_item`
- `title`: string
- `description`: string
- `status`: string
- `priority`: string
- `tags`: array of strings
- `child_roadmap_item_ids`: array of strings
- `epic_ids`: array of strings
- `story_ids`: array of strings
- `test_case_ids`: array of strings
- `created_at`: ISO-8601 string
- `updated_at`: ISO-8601 string

--- Epics / Stories Rendering Contract ---
- Keep `epic_ids`, `story_ids`, and `test_case_ids` accurate.
- The build pipeline enriches generated pages from registry-declared table patterns.
- If `epics` is present, keep flat `epic_ids` and `story_ids` arrays in sync.
- When adding a new epic, append instead of replacing.
- If an epic has no stories yet, set `"stories": []`.
- Roadmap item detail pages should show epics and user stories in the dedicated nested epics/stories table when relationship data is available.
- For each linked epic, provide either an embedded epic object with `stories`/`story_ids` or enough source relationship data for the renderer to resolve child stories.
- Keep epic rows tied to stable `epic_ids`; keep story rows tied to stable `story_ids` and each epic's own story references.

--- Cross-Artifact Linking Rules ---
- Generated Spec Builder pages are derived from JSON and MUST NOT be edited manually.
- If a roadmap item lists `story_ids`, each story JSON should reference this roadmap item when supported.
- If a roadmap item lists `epic_ids`, those epic JSON artifacts should include related story IDs and test case IDs as appropriate.
- If a test case is owned by this roadmap item, append its id to `test_case_ids` without duplicates.

--- Document Linkage ---
- The roadmap item JSON should include a stable `links` object:
  - `links.feature_specs`
  - `links.detailed_designs`
  - `links.architecture_specs`
- Each entry is a docs-rooted path beginning with `kavia-docs/CodeWiki/...`.

--- Recommended Fields ---
- `owner`
- `notes`
- `jira_link`
- `acceptance_criteria`
- `estimated_effort`

--- Provenance ---
- `provenance.created_at`: set on creation, keep stable
- `provenance.updated_at`: update on meaningful changes
- `provenance.source`: `spec_builder`
- `provenance.external_refs`: array

===============================================================================
SECTION 3: MARKDOWN GENERATION INSTRUCTIONS
===============================================================================
The hub Markdown page regenerates automatically when a roadmap item JSON file is created or updated or when a full CodeWiki rebuild runs.

Pipeline entry point:
- `spec_builder/content_generator.py -> prepare_spec_builder_content(codewiki_root=...)`

You MUST NOT hand-edit the generated hub file unless the task explicitly requests a one-off non-generated page.

--- Canonical Roadmap Item Page Path (CRITICAL — MUST FOLLOW) ---
For links to roadmap item pages:

A) Markdown links:
- Use `.md` path:
  `[My Feature](../Artifacts/SpecBuilder/pages/roadmap_items/my-feature.md)`

B) Raw HTML links:
- Use `.html` path:
  `<a href="../Artifacts/SpecBuilder/pages/roadmap_items/my-feature.html">My Feature</a>`

===============================================================================
SECTION 4: ORCHESTRATION INSTRUCTIONS
===============================================================================
Create flow:
1. Assign a stable slug-style id.
2. Write the JSON under the canonical `roadmap_items/` folder.
3. Add the item id to `kavia-docs/CodeWiki/Artifacts/SpecBuilder/json/roadmap.json`.
4. Update discoverability indexes:
   - `kavia-docs/CodeWiki/Roadmap/index.md`
   - `kavia-docs/CodeWiki/Artifacts/index.md` when needed
5. Allow the pipeline to generate the two pages.

Update flow:
1. Locate the existing JSON.
2. Apply minimal targeted edits.
3. Update `provenance.updated_at`.
4. Never change the `id`.
5. Never remove unknown fields.
6. Append to arrays instead of replacing.
7. If `epic_ids` or `story_ids` exist but `epics` does not, add `epics`.

===============================================================================
SECTION 5: COMMON RULES
===============================================================================
- Status values: `draft | in_review | approved | in_progress | done | blocked`
- Priority values: `high | medium | low`
- JSON `type` uses `spec_builder.roadmap_item`
- Stable ids only
- Merge, don't replace
- Minimal diffs
- Output valid JSON only
