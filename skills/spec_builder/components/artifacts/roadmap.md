# Artifact Component: roadmap

Use this component when creating or updating the top-level Spec Builder roadmap container artifact.

===============================================================================
SECTION 1: WHEN TO USE
===============================================================================
Use this component when the user wants to:
- Create a new roadmap container
- Update the existing roadmap container
- Manage the top-level `roadmap.json`
- Configure customer-facing roadmap grouping, presentation, milestones, sprints, releases, risks, dependencies, and notes

Do NOT use this component for:
- Creating or updating an individual roadmap item
- Creating epics, stories, or test cases directly

===============================================================================
SECTION 2: JSON ARTIFACT INSTRUCTIONS
===============================================================================

--- Roadmap Container (JSON) ---
- Path: `kavia-docs/CodeWiki/Artifacts/SpecBuilder/json/roadmap.json`
- The roadmap container holds metadata and references to all roadmap items.
- The `items` array remains the canonical ordered membership list for roadmap item IDs.
- Preserve existing fields and unknown fields when updating.
- Existing minimal roadmap JSON remains valid. The optional fields below enable a richer, customer-facing page.

Recommended schema:
  {
    "id": "roadmap",
    "type": "spec_builder.roadmap",
    "title": "<Roadmap Title>",
    "summary": "<Short customer-facing executive summary>",
    "description": "<Longer roadmap context>",
    "status": "active",
    "owner": "<Roadmap owner>",
    "horizon": "<Planning horizon, for example Q3-Q4 2026>",
    "current_milestone_id": "<active milestone id>",
    "current_sprint_id": "<active sprint id>",
    "grouping": {
      "mode": "milestone|sprint|status|priority|flat",
      "past_statuses": ["done", "completed", "shipped", "cancelled"],
      "current_statuses": ["in_progress", "blocked", "in_review", "active"],
      "upcoming_statuses": ["draft", "approved", "planned", "todo"]
    },
    "presentation": {
      "show_kpis": true,
      "show_timeline": true,
      "show_current_focus": true,
      "show_past_work": true,
      "default_grouping": "milestone",
      "past_section_title": "Recently Completed",
      "upcoming_section_title": "Upcoming Roadmap"
    },
    "items": ["<roadmap-item-id-1>", "<roadmap-item-id-2>"],
    "milestones": [],
    "sprints": [],
    "releases": [],
    "risks": [],
    "dependencies": [],
    "assumptions": [],
    "notes": "<Optional free-form delivery notes>",
    "provenance": {
      "created_at": "<ISO timestamp>",
      "updated_at": "<ISO timestamp>",
      "source": "spec_builder"
    }
  }

Field guidance:
- `summary` is the short executive summary displayed in the roadmap hero.
- `description` is longer context displayed after the summary when present.
- `owner`, `horizon`, `status`, and `provenance.updated_at` appear as header metadata when present.
- `current_milestone_id` and `current_sprint_id` explicitly control the Current Focus section.
- `grouping.mode` controls how upcoming work is grouped. Prefer `milestone` for customer-facing roadmaps.
- `presentation` is advisory. The renderer uses professional defaults when it is absent.
- `risks`, `dependencies`, and `assumptions` may be arrays of strings or objects with `title`, `description`, `status`, and `owner`.

--- Milestones (JSON objects inside roadmap.json) ---
Milestones organize roadmap items around customer-readable delivery outcomes.

Schema:
  {
    "id": "<milestone-id>",
    "title": "<Milestone Title>",
    "description": "<Milestone description>",
    "starts_at": "<YYYY-MM-DD>",
    "ends_at": "<YYYY-MM-DD>",
    "target_date": "<YYYY-MM-DD>",
    "status": "draft|planned|active|in_progress|done|blocked|shipped",
    "confidence": "low|medium|high",
    "theme": "<Theme or outcome>",
    "item_ids": ["<roadmap-item-id>"],
    "sprint_ids": ["<sprint-id>"]
  }

Milestone rules:
- Use `starts_at` and `ends_at` when the milestone has a range.
- Use `target_date` when the milestone has one target date.
- Keep `item_ids` aligned with top-level `items`; do not use milestone membership to hide items from the roadmap.

--- Sprints (JSON objects inside roadmap.json) ---
Sprints are optional and should be used when the team wants short-cycle planning on the roadmap page.

Schema:
  {
    "id": "<sprint-id>",
    "title": "<Sprint Title>",
    "milestone_id": "<milestone-id>",
    "starts_at": "<YYYY-MM-DD>",
    "ends_at": "<YYYY-MM-DD>",
    "goal": "<Sprint goal>",
    "status": "planned|active|in_progress|done|blocked",
    "item_ids": ["<roadmap-item-id>"]
  }

Sprint rules:
- If `grouping.mode` is `sprint`, upcoming work is grouped by sprint.
- If `grouping.mode` is `milestone`, sprints remain useful as metadata and may be referenced by milestone cards.

--- Roadmap Items (JSON) ---
- Path: `kavia-docs/CodeWiki/Artifacts/SpecBuilder/json/roadmap_items/<id>.json`
- Each roadmap item has a stable slug-style ID.
- The roadmap renderer reads resolved roadmap item payloads and displays richer columns when these fields exist.
- Optional columns are omitted when no item in a table has data for that column, avoiding visually empty tables.

Schema:
  {
    "id": "<slug-id>",
    "type": "spec_builder.roadmap_item",
    "title": "<Human Readable Title>",
    "description": "<Detailed description>",
    "status": "draft|in_review|approved|planned|todo|in_progress|done|completed|shipped|blocked|cancelled",
    "priority": "high|medium|low",
    "owner": "<Owner>",
    "milestone_id": "<milestone-id>",
    "sprint_id": "<sprint-id>",
    "target_date": "<YYYY-MM-DD>",
    "completed_at": "<ISO timestamp or date>",
    "shipped_at": "<ISO timestamp or date>",
    "release_date": "<YYYY-MM-DD>",
    "confidence": "low|medium|high",
    "theme": "<Theme>",
    "estimated_effort": "<effort estimate>",
    "links": [{"type": "epic", "id": "<epic-id>"}],
    "tags": [],
    "acceptance_criteria": [],
    "provenance": {
      "created_at": "<ISO timestamp>",
      "updated_at": "<ISO timestamp>",
      "source": "spec_builder",
      "external_refs": []
    }
  }

Roadmap item display rules:
- Always include `status` and `priority` when known.
- Add `milestone_id`, `sprint_id`, `target_date`, `owner`, and `confidence` when the item should appear in richer grouped roadmap tables.
- Use `done`, `completed`, `shipped`, or `cancelled` for past work.
- Use `in_progress`, `blocked`, or `in_review` for current focus unless the roadmap explicitly sets `current_milestone_id` or `current_sprint_id`.
- Use `draft`, `approved`, `planned`, or `todo` for upcoming work.

===============================================================================
SECTION 3: MARKDOWN GENERATION INSTRUCTIONS
===============================================================================

--- Canonical Roadmap Item Page Path (CRITICAL — MUST FOLLOW) ---
Spec Builder generates TWO pages per roadmap item JSON:
1. Full detail page: `kavia-docs/CodeWiki/Artifacts/SpecBuilder/pages/roadmap_items/<id>.md`
2. Hub alias page:   `kavia-docs/CodeWiki/Artifacts/SpecBuilder/pages/<id>-hub.md`

LINK FORMAT DEPENDS ON CONTEXT:

A) Markdown-syntax links:
- CORRECT: `[Item Title](../Artifacts/SpecBuilder/pages/roadmap_items/<id>.md)`
- WRONG: `[Item Title](../Artifacts/SpecBuilder/pages/roadmap_item.<id>.md)`

B) Raw HTML `<a href="...">` inside Markdown pages:
- CORRECT: `<a href="../Artifacts/SpecBuilder/pages/roadmap_items/<id>.html">Item Title</a>`
- WRONG: `<a href="../Artifacts/SpecBuilder/pages/roadmap_items/<id>.md">Item Title</a>`

--- Customer-Facing Roadmap Page Rules ---
- The top-level roadmap page should read as a professional planning page, not a raw JSON inventory.
- Prefer a hero summary, KPI counts, timeline, current focus, upcoming work, recently completed work, and delivery notes.
- Roadmap item listings must be semantic Markdown or HTML tables when generated statically.
- Avoid empty table columns. Only emit optional columns when the underlying data exists.
- Group upcoming roadmap items by milestone by default. Use sprint grouping only when the roadmap explicitly requires sprint-level planning.
- Do not mix completed or shipped items into the main upcoming work table.

===============================================================================
SECTION 4: ORCHESTRATION INSTRUCTIONS
===============================================================================
- Sort the `items` array in `roadmap.json` by id for deterministic output.
- When updating, merge rather than replace and preserve unknown fields.
- Always update `provenance.updated_at` on modifications.
- Update `kavia-docs/CodeWiki/Roadmap/index.md` with links to new roadmap items.
- Update `kavia-docs/CodeWiki/Artifacts/index.md` for discoverability.
- Keep milestone `item_ids` and sprint `item_ids` consistent with the top-level `items` list.
- Preserve customer-facing presentation settings unless the user asks to change them.

===============================================================================
SECTION 5: COMMON RULES
===============================================================================
- Roadmap container type: `spec_builder.roadmap`
- Roadmap item type: `spec_builder.roadmap_item`
- Epic type: `spec_builder.epic`
- User story type: `spec_builder.user_story`
- Test case type: `spec_builder.test_case`

- IDs must be stable slug-style and must not change across regeneration.
- Merge, don't replace.
- Preserve existing array ordering unless this component explicitly requires sorting.
- Output valid JSON only.
