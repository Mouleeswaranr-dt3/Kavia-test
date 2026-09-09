# Artifact Component: research_doc

Use this component to create or update Spec Builder research and discovery notes Markdown documents.

===============================================================================
SECTION 1: WHEN TO USE
===============================================================================
Use this component when the user wants to:
- Create a new research or discovery notes document
- Update an existing research document
- Capture investigation findings or technology evaluations

Do NOT use this component for:
- Feature Specs
- Architecture Specs
- Detailed Designs
- Execution Blueprints

===============================================================================
SECTION 2: MARKDOWN GENERATION INSTRUCTIONS
===============================================================================
- Write the research document under:
  `kavia-docs/CodeWiki/Artifacts/SpecBuilder/pages/<slug>.md`

Update nearest relevant indexes after creating a new Markdown page:
- `kavia-docs/CodeWiki/Artifacts/index.md`
- `kavia-docs/CodeWiki/Artifacts/SpecBuilder/pages/index.md` if it exists

Mandatory front matter fields:
- `id`
- `type`: exactly `spec_builder.research_doc`
- `title`
- `status`
- `tags`

Recommended structure:
- Summary
- Background
- Findings or Analysis
- Recommendations
- References

===============================================================================
SECTION 3: ORCHESTRATION INSTRUCTIONS
===============================================================================
- If tied to a roadmap item, consider linking from the roadmap item JSON links object when appropriate.
- Preserve existing content and add new findings in place rather than rewriting unrelated sections.

===============================================================================
SECTION 4: COMMON RULES
===============================================================================
- Preserve the `id` once set.
- Make minimal diffs when updating.
- Output valid Markdown with YAML front matter.
