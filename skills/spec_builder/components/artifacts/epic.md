# Artifact Component: epic

Use this component to generate or update Spec Builder epic artifacts that decompose roadmap items into implementable work packages.

===============================================================================
SECTION 1: WHEN TO USE
===============================================================================
Use this component when the user wants to:
- Create a new epic artifact
- Update an existing epic artifact
- Link stories or test cases to an epic

Do NOT use this component for:
- Creating roadmap items
- Creating standalone stories or test cases without epic maintenance

===============================================================================
SECTION 2: JSON ARTIFACT INSTRUCTIONS
===============================================================================
- Path: `kavia-docs/CodeWiki/Artifacts/SpecBuilder/json/epics/<id>.json`
- Each epic has a stable slug-style ID.

Required fields:
- `id`
- `type`: exactly `spec_builder.epic`
- `title`
- `description`
- `status`
- `priority`
- `parent_roadmap_item`
- `story_ids`

Expected shape:
{
  "id": "<slug-id>",
  "type": "spec_builder.epic",
  "title": "<Epic Title>",
  "description": "<Detailed epic description>",
  "status": "draft|in_review|approved|in_progress|done|blocked",
  "priority": "high|medium|low",
  "parent_roadmap_item": "<roadmap-item-id>",
  "story_ids": ["<story-id-1>", "<story-id-2>"],
  "estimated_effort": "<effort estimate>",
  "links": [
    {"type": "roadmap_item", "id": "<parent-roadmap-item-id>"},
    {"type": "story", "id": "<child-story-id>"}
  ],
  "tags": [],
  "acceptance_criteria": [],
  "provenance": {
    "created_at": "<ISO timestamp>",
    "updated_at": "<ISO timestamp>",
    "source": "spec_builder",
    "external_refs": []
  }
}

===============================================================================
SECTION 3: ORCHESTRATION INSTRUCTIONS
===============================================================================
- When creating an epic, also update the parent roadmap item's links array and `epic_ids`.
- Sort the `story_ids` array by id for deterministic output.
- When updating, merge rather than replace and preserve unknown fields.
- Always update `provenance.updated_at`.

===============================================================================
SECTION 4: COMMON RULES
===============================================================================
- Status values: `draft | in_review | approved | in_progress | done | blocked`
- Priority values: `high | medium | low`
- IDs must be stable and never change.
- Output valid JSON only.
