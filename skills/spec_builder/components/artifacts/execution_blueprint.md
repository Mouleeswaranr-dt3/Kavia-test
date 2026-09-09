# Artifact Component: execution_blueprint

Use this component to create or update Spec Builder execution blueprint Markdown documents.

===============================================================================
SECTION 1: WHEN TO USE
===============================================================================
Use this component when the user wants to:
- Create a new execution blueprint for a roadmap item or epic
- Update an existing execution blueprint with new steps or status changes

Do NOT use this component for:
- Feature Specs
- Detailed Designs
- Impact Analysis

===============================================================================
SECTION 2: MARKDOWN GENERATION INSTRUCTIONS
===============================================================================
- Write the blueprint under:
  `kavia-docs/CodeWiki/Artifacts/SpecBuilder/pages/blueprints/<slug>.md`

If you create a new blueprint, update:
- `kavia-docs/CodeWiki/Artifacts/index.md`
- `kavia-docs/CodeWiki/Artifacts/SpecBuilder/pages/index.md` if it exists

Mandatory front matter fields:
- `id`
- `type`: exactly `spec_builder.execution_blueprint`
- `title`
- `status`
- `tags`
- `source_artifacts`

Required sections:
- Scope
- Prerequisites
- Implementation Steps
- Dependencies & Ordering
- Verification Plan
- Risk Notes
- Related Artifacts

===============================================================================
SECTION 3: ORCHESTRATION INSTRUCTIONS
===============================================================================
- Link source planning artifacts using relative Markdown links.
- Reference exact codebase files with backticks.
- Maintain stable step numbering on updates.
- Mark completed steps with checkboxes or status indicators.

===============================================================================
SECTION 4: COMMON RULES
===============================================================================
- Preserve the `id` once set.
- Merge new steps with existing content rather than replacing whole sections.
- Make minimal diffs when updating.
- Output valid Markdown with YAML front matter.
