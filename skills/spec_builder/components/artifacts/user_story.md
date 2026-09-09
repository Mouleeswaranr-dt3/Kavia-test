# Artifact Component: user_story

Use this component to generate or maintain Spec Builder user story artifacts with acceptance criteria and parent-epic traceability.

===============================================================================
SECTION 1: WHEN TO USE
===============================================================================
Use this component when the user wants to:
- Create a new user story artifact
- Update an existing user story artifact
- Link a story to an epic or roadmap item

Do NOT use this component for:
- Creating epics
- Creating test cases
- Creating roadmap items

===============================================================================
SECTION 2: JSON ARTIFACT INSTRUCTIONS
===============================================================================
- Path: `kavia-docs/CodeWiki/Artifacts/SpecBuilder/json/stories/<id>.json`
- Each story has a stable slug-style ID.

Required fields:
- `id`
- `type`: exactly `spec_builder.user_story`
- `title` in the form `As a <persona>, I want <goal> so that <benefit>`
- `description`
- `status`
- `priority`
- `parent_epic`

Expected shape:
{
  "id": "<slug-id>",
  "type": "spec_builder.user_story",
  "title": "As a <persona>, I want <goal> so that <benefit>",
  "description": "<Detailed story description>",
  "status": "draft|in_review|approved|in_progress|done|blocked",
  "priority": "high|medium|low",
  "parent_epic": "<epic-id>",
  "persona": "<user persona>",
  "goal": "<what the user wants>",
  "benefit": "<why the user wants it>",
  "acceptance_criteria": [
    "Given <context>, when <action>, then <result>"
  ],
  "estimated_effort": "<story points or time>",
  "links": [
    {"type": "epic", "id": "<parent-epic-id>"},
    {"type": "test_case", "id": "<linked-test-id>"}
  ],
  "tags": [],
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
- Use the canonical user-story title format.
- When creating a story, also update the parent epic's `story_ids` array.
- Include at least one acceptance criterion per story.
- When updating, merge rather than replace and preserve unknown fields.
- Always update `provenance.updated_at`.

===============================================================================
SECTION 4: COMMON RULES
===============================================================================
- Status values: `draft | in_review | approved | in_progress | done | blocked`
- Priority values: `high | medium | low`
- IDs must be stable and never change.
- Output valid JSON only.
