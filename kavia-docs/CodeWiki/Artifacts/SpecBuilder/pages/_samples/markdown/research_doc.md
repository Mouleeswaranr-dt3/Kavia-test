---
id: "sample-spec-builder-research"
type: "spec_builder.research_doc"
title: "Research Notes: Packaged Spec Builder Sample Asset Drift"
status: "draft"
tags:
  - "spec-builder"
  - "research"
  - "sample"
---

# Research Notes: Packaged Spec Builder Sample Asset Drift

## Summary
These sample research notes capture the observation that packaged Spec Builder examples can drift after refactors or schema updates. They demonstrate the expected structure for a lightweight discovery document that informs maintenance work.

## Background
The packaged `source_assets/samples/` directory is often used as a reference during seeding, demonstrations, and maintenance. When those files are reduced to placeholders or older field shapes, they no longer help maintainers understand the current intended contract.

## Findings
The current registry still defines a full set of sample artifacts, but minimal placeholder content obscures artifact-specific fields and relationships. The most useful restorative approach is to keep the examples small while still reflecting the current type names, linkage fields, and authored Markdown sections.

## Recommendations
Maintain one coherent sample roadmap hierarchy across related JSON examples. For authored Markdown examples, include enough structure to show how each document should read without turning the packaged assets into exhaustive documentation.

## References
- Packaged artifact registry
- Current Spec Builder skill documents
- Packaged sample asset bundle under `source_assets/samples/`
