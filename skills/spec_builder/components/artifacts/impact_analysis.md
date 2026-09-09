# Artifact Component: impact_analysis

Use this component to generate Spec Builder impact analysis reports describing affected artifacts and recommendations.

===============================================================================
SECTION 1: WHEN TO USE
===============================================================================
Use this component when the user wants to:
- Analyze the impact of a requirement change
- Generate an impact report showing affected artifacts
- Identify cascading effects of a proposed change

Do NOT use this component for:
- Feature Specs
- Architecture Specs
- Research documents

===============================================================================
SECTION 2: MARKDOWN GENERATION INSTRUCTIONS
===============================================================================
- Path: `kavia-docs/CodeWiki/Artifacts/SpecBuilder/pages/impact/<slug>.md`
- Format: Markdown with YAML front matter

Mandatory front matter:
- `id`: `impact.<slug>`
- `type`: `spec_builder.impact_analysis`
- `title`
- `status`
- `tags`

Required sections:
- Change Summary
- Affected Artifacts
- Dependency Graph
- Detailed Impact
- Recommendations
- Risk Assessment

===============================================================================
SECTION 3: ORCHESTRATION INSTRUCTIONS
===============================================================================
- Read all potentially affected artifacts before generating the report.
- Classify impact levels as high, medium, or low.
- Flag stale artifacts that need regeneration.
- Provide actionable recommendations for each affected artifact.
- After creating the report, update `kavia-docs/CodeWiki/Artifacts/index.md`.

===============================================================================
SECTION 4: COMMON RULES
===============================================================================
- Preserve the `id` once set.
- Merge rather than replace when updating.
- Use Mermaid diagrams for dependency visualization.
- Output valid Markdown with YAML front matter.
