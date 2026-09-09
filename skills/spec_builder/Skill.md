---
name: spec_builder
description: "Use this skill whenever the user asks to create, update, link, regenerate, or fix a roadmap, roadmap item, epic, user story, test case, feature spec, architecture spec, detailed design, research document, execution blueprint, impact analysis, or any generated page or index derived from those Spec Builder artifacts. Prefer this skill over generic documentation or page editing for those artifact families."
owner: system
source_ecosystem: kavia
slash_command:
  command: spec-builder
  enabled: true
---

# spec_builder

Use this skill for Spec Builder artifact work. It is the single package-first entrypoint for create, update, link, regenerate, and import/export tasks.

Artifact families covered:
- roadmap
- roadmap item
- epic
- user story
- test case
- feature spec
- architecture spec
- detailed design
- research document
- execution blueprint
- impact analysis


Source of truth:
- JSON under `kavia-docs/CodeWiki/Artifacts/SpecBuilder/json/**` is the source of truth for JSON-backed artifacts.
- Pages under `kavia-docs/CodeWiki/Artifacts/SpecBuilder/pages/**` are derived output unless an artifact component says the Markdown is authored.
- Do not hand-edit generated pages when JSON is authoritative.
- Preserve IDs, relationships, links arrays, provenance, and unknown fields.


Discoverability:
- If an artifact component requires index or roadmap-link updates, they are part of the task.


Format rules:
- JSON-backed Spec Builder artifacts must remain valid JSON with no comments and no trailing commas.
- Preserve stable ids, unknown fields, and array ordering unless a specific artifact contract requires a different behavior.
- Use canonical `type` values in the form `spec_builder.<kind>` for JSON artifacts.
- For authored Markdown artifacts, preserve required front matter, keep a single H1 after front matter, and use full self-contained documents rather than partial snippets.
- Include breadcrumb navigation and relative Markdown links whenever the artifact component expects them.
- Generated pages under `kavia-docs/CodeWiki/Artifacts/SpecBuilder/pages/**` are derived outputs for JSON-backed artifacts unless the artifact component explicitly says otherwise.
- Do not manually edit generated pages to change source-of-truth content; fix source JSON, related links, or generator-facing metadata instead.
- Use canonical generated-page paths and required `.md` versus `.html` link conventions defined by the relevant artifact component.
- When creating discoverable artifacts or changing their navigation surfaces, update the nearest relevant index pages and any required roadmap-link fields.
- Parent and child references, document-link arrays, and id arrays must stay synchronized with the artifacts they reference.

Generic table creation rules:
- Prefer semantic tables for repeatable structured collections that users need to scan, compare, sort mentally, or validate for completeness.
- Use tables for artifact indexes, roadmap item lists, relationship matrices, child artifact lists, test case inventories, and any repeated object array with stable columns.
- Do not flatten important relationship arrays into comma-separated prose when a table can preserve row-level visibility.
- For JSON-backed artifacts, drive tables from source JSON fields and registry/generator metadata; do not hand-edit generated Markdown pages to force table output.
- Every generated or authored table must have a clear heading or accessible label, stable column names, and deterministic row ordering.
- Keep generic columns concise. Put long prose in a Description/Summary column with truncation or in an expandable detail area when supported by the renderer.
- Use badges or compact labels for status, priority, type, and ownership fields when the runtime renderer supports them.
- Preserve IDs and links in table rows so users can navigate from index/container pages to detail pages.
- If a table depends on related artifacts, keep source relationship fields synchronized so the renderer can resolve nested rows instead of showing unresolved IDs.
- Artifact-specific components should only add table requirements that are unique to that artifact family, such as mandatory columns, relationship nesting, or canonical source fields.

===============================================================================
SECTION 1: REQUIRED COMPONENT READS
===============================================================================
Always:
1. Identify the artifact types that are being worked on.
2. Read the matching file under `components/artifacts/` within this skill package.
3. Determine the workflow: create, update, link, regenerate, or import/export.
4. Apply the matching workflow rules in SECTION 2.


Artifact component map:
- roadmap -> `components/artifacts/roadmap.md`
- roadmap item -> `components/artifacts/roadmap_item.md`
- epic -> `components/artifacts/epic.md`
- user story -> `components/artifacts/user_story.md`
- test case -> `components/artifacts/test_case.md`
- feature spec -> `components/artifacts/feature_spec.md`
- architecture spec -> `components/artifacts/architecture_spec.md`
- detailed design -> `components/artifacts/detailed_design.md`
- research document -> `components/artifacts/research_doc.md`
- execution blueprint -> `components/artifacts/execution_blueprint.md`
- impact analysis -> `components/artifacts/impact_analysis.md`

===============================================================================
SECTION 2: WORKFLOW RULES
===============================================================================

Create:
- Choose a stable slug/id when required.
- Write to the canonical path from the artifact component.
- Initialize mandatory fields.
- Update required parent/child references, links arrays, indexes, and roadmap references.
- Do not hand-edit generated pages for JSON-backed artifacts.

Update:
- Locate the canonical artifact.
- Apply only requested changes plus required consistency updates.
- Preserve IDs, unknown fields, unrelated sections, and ordering unless the component says otherwise.
- Maintain required relationship and provenance fields.

Link:
- Read both relevant artifact components when two artifact types are involved.
- Update the required source, parent, and symmetric relationship fields.
- Avoid duplicate links.
- Keep `epic_ids`, `story_ids`, `test_case_ids`, and roadmap-item spec link arrays synchronized when applicable.

Regenerate:
- Change the source-of-truth layer, usually JSON, not generated Markdown.
- Fix relationship/link data that drives rendered output.
- Only touch generated pages directly when the task explicitly authorizes a non-generated page change.

Import/export:
- Map external data to canonical IDs, types, paths, and relationships.
- Preserve existing artifact identity and provenance.
- Do not invent unsupported fields.
- Export from canonical source-of-truth values, not generated-page approximations.

===============================================================================
SECTION 3: COMPLETION CHECKLIST
===============================================================================
Before finishing, verify:
- The correct artifact component was used.
- The correct workflow rules from this skill were applied.
- The required format rules from this skill were applied.
- IDs and parent/child relationships remain valid.
- Required index or roadmap-link updates were made.
- Generated pages were not manually edited when JSON is the source of truth.
