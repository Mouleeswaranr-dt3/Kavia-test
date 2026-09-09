# Artifact Component: feature_spec

Use this component to create or update Spec Builder feature specification Markdown artifacts and maintain roadmap linkage.

===============================================================================
SECTION 1: WHEN TO USE
===============================================================================
Use this component when the user wants to:
- Create a new Feature Spec document
- Update an existing Feature Spec document
- Link a Feature Spec to a roadmap item

Do NOT use this component for:
- Architecture Specs
- Detailed Designs
- Research documents

===============================================================================
SECTION 2: MARKDOWN GENERATION INSTRUCTIONS
===============================================================================
- Write the spec under:
  `kavia-docs/CodeWiki/Specs/FeatureSpecs/<slug>.md`

If you create a new Feature Spec Markdown file, you MUST update:
- `kavia-docs/CodeWiki/Specs/index.md`
- `kavia-docs/CodeWiki/Specs/FeatureSpecs/index.md`

Mandatory front matter keys:
- `id`
- `type`: exactly `feature-spec`
- `title`
- `status`
- `owner`
- `tags`

Roadmap linkage keys when tied to a roadmap item:
- `roadmap_item_id`
- `roadmap_item_json_path`

Required sections:
- Overview
- User Stories
- Functional Requirements
- Non-Functional Requirements
- Acceptance Criteria
- Scope
- Dependencies
- Rollout Plan

Recommended structure:
- `# <Title>`
- `## Summary`
- `## Goals`
- `## Non-Goals`
- `## Requirements`
- `## Acceptance Criteria`
- `## Rollout / Migration`
- `## Risks / Open Questions`
- `## Related`

===============================================================================
SECTION 3: ORCHESTRATION INSTRUCTIONS
===============================================================================
If the Feature Spec is linked to a roadmap item, you MUST do BOTH:
1. Add `roadmap_item_id` and `roadmap_item_json_path` to front matter.
2. Update the roadmap item JSON to include the doc path in `links.feature_specs`.

Store the full docs-rooted path:
- `kavia-docs/CodeWiki/Specs/FeatureSpecs/<slug>.md`

If the roadmap item id is unknown, use `MISSING_ROADMAP_ITEM_ID` and note the gap under risks/open questions.

===============================================================================
SECTION 4: COMMON RULES
===============================================================================
- Start with a single H1 after front matter.
- Include breadcrumb navigation.
- Use full paragraphs.
- Cross-reference related JSON artifacts using relative Markdown links.
- Preserve stable identifiers and unknown front matter keys.
- Make minimal diffs when updating.
