# Artifact Component: test_case

Use this component to generate or maintain Spec Builder test case artifacts linked to user stories and roadmap items.

===============================================================================
SECTION 1: WHEN TO USE
===============================================================================
Use this component when the user wants to:
- Create a new test case artifact
- Update an existing test case artifact
- Link a test case to a user story or roadmap item

Do NOT use this component for:
- Creating user stories
- Creating epics

===============================================================================
SECTION 2: JSON ARTIFACT INSTRUCTIONS
===============================================================================
- Path: `kavia-docs/CodeWiki/Artifacts/SpecBuilder/json/test_cases/<id>.json`
- Each test case has a stable slug-style ID.

Required fields:
- `id`
- `type`: exactly `spec_builder.test_case`
- `title`
- `description`
- `status`
- `priority`
- `test_type`
- `parent_story`
- `jira_link`

Expected shape:
{
  "id": "<slug-id>",
  "type": "spec_builder.test_case",
  "title": "<Test Case Title>",
  "description": "<What this test validates>",
  "status": "draft|in_review|approved|passed|failed|blocked",
  "priority": "high|medium|low",
  "test_type": "unit|integration|e2e|acceptance|exploratory",
  "parent_story": "<story-id>",
  "preconditions": ["<precondition 1>"],
  "steps": [
    {"step": 1, "action": "<action>", "expected_result": "<expected>"}
  ],
  "postconditions": ["<postcondition 1>"],
  "jira_link": "<URL to the JIRA issue or empty string>",
  "links": [
    {"type": "user_story", "id": "<parent-story-id>"}
  ],
  "tags": [],
  "provenance": {
    "created_at": "<ISO timestamp>",
    "updated_at": "<ISO timestamp>",
    "source": "spec_builder",
    "external_refs": []
  }
}

Field notes:
- `test_type` is rendered as a badge in test case detail pages and roadmap-item test-case tables.
- `jira_link` is rendered as a clickable JIRA badge when present.
- To render fully on roadmap-item pages:
  1. Set `test_type`
  2. Set `jira_link` when available
  3. Set `roadmap_item_id` when supported
  4. Add the test case id to the roadmap item's `test_case_ids`

===============================================================================
SECTION 3: ORCHESTRATION INSTRUCTIONS
===============================================================================
- When creating a test case, also update the parent story's links array.
- Each test case must have at least one step.
- Sort steps by step number for deterministic output.
- When updating, merge rather than replace and preserve unknown fields.
- Always update `provenance.updated_at`.

===============================================================================
SECTION 4: COMMON RULES
===============================================================================
- Status values: `draft | in_review | approved | passed | failed | blocked`
- Priority values: `high | medium | low`
- IDs must be stable and never change.
- Output valid JSON only.
