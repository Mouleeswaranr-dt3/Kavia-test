# Artifact Component: detailed_design

Use this component to create or update Spec Builder detailed design Markdown artifacts and maintain roadmap linkage.

===============================================================================
SECTION 1: WHEN TO USE
===============================================================================
Use this component when the user wants to:
- Create a new Detailed Design document
- Update an existing Detailed Design document
- Link a Detailed Design to a roadmap item

Do NOT use this component for:
- Feature Specs
- Architecture Specs
- Research documents

===============================================================================
SECTION 2: MARKDOWN GENERATION INSTRUCTIONS
===============================================================================
- Write the design under:
  `kavia-docs/CodeWiki/Specs/DetailedDesigns/<slug>.md`

If you create a new Detailed Design, you MUST update:
- `kavia-docs/CodeWiki/Specs/index.md`
- `kavia-docs/CodeWiki/Specs/DetailedDesigns/index.md`

Mandatory front matter keys:
- `id`
- `type`: exactly `detailed-design`
- `title`
- `status`
- `owner`
- `tags`

Roadmap linkage keys when tied to a roadmap item:
- `roadmap_item_id`
- `roadmap_item_json_path`

Required sections:
- Executive Summary
- Requirements
- Detailed Design
- Error Handling
- Testing Strategy
- Implementation Plan
- Open Questions

Recommended structure:
- Context
- Goals / Non-Goals
- Proposed Design
- Data Model / Shapes
- Algorithms / Sequencing
- APIs / Interfaces
- Validation
- Testing Plan
- Rollout Plan
- Risks / Open Questions
- Related

===============================================================================
SECTION 3: ORCHESTRATION INSTRUCTIONS
===============================================================================
If the Detailed Design is linked to a roadmap item, you MUST do BOTH:
1. Add roadmap linkage metadata in front matter.
2. Update the roadmap item JSON `links.detailed_designs` array with the full docs-rooted path:
   `kavia-docs/CodeWiki/Specs/DetailedDesigns/<slug>.md`

===============================================================================
SECTION 4: COMMON RULES
===============================================================================
- Start with a single H1 after front matter.
- Include breadcrumb navigation.
- Use full paragraphs.
- Include code snippets and Mermaid diagrams where useful.
- Preserve stable identifiers and unknown front matter keys.
- Make minimal diffs when updating.
