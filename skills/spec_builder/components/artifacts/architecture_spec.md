# Artifact Component: architecture_spec

Use this component to create or update Spec Builder architecture specification Markdown artifacts and maintain roadmap linkage.

===============================================================================
SECTION 1: WHEN TO USE
===============================================================================
Use this component when the user wants to:
- Create a new Architecture Spec document
- Update an existing Architecture Spec document
- Link an Architecture Spec to a roadmap item

Do NOT use this component for:
- Feature Specs
- Detailed Designs
- Research documents

===============================================================================
SECTION 2: MARKDOWN GENERATION INSTRUCTIONS
===============================================================================
- Write the spec under:
  `kavia-docs/CodeWiki/Specs/ArchitectureSpecs/<slug>.md`

If you create a new Architecture Spec, you MUST update:
- `kavia-docs/CodeWiki/Specs/index.md`
- `kavia-docs/CodeWiki/Specs/ArchitectureSpecs/index.md`

Mandatory front matter keys:
- `id`
- `type`: exactly `architecture-spec`
- `title`
- `status`
- `owner`
- `tags`

Roadmap linkage keys when tied to a roadmap item:
- `roadmap_item_id`
- `roadmap_item_json_path`

Required sections:
- Overview
- Context
- Decision
- Components
- Interfaces
- Data Model
- Cross-Cutting Concerns
- Alternatives Considered
- Migration Strategy
- Risks and Mitigations

===============================================================================
SECTION 3: ORCHESTRATION INSTRUCTIONS
===============================================================================
If the Architecture Spec is linked to a roadmap item, you MUST do BOTH:
1. Add roadmap linkage metadata in front matter.
2. Update the roadmap item JSON `links.architecture_specs` array with the full docs-rooted path:
   `kavia-docs/CodeWiki/Specs/ArchitectureSpecs/<slug>.md`

===============================================================================
SECTION 4: COMMON RULES
===============================================================================
- Start with a single H1 after front matter.
- Include breadcrumb navigation.
- Use full paragraphs.
- Include Mermaid diagrams where useful.
- Preserve stable identifiers and unknown front matter keys.
- Make minimal diffs when updating.
