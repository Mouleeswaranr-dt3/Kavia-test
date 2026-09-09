---
id: "sample-spec-builder-blueprint"
type: "spec_builder.execution_blueprint"
title: "Execution Blueprint: Refresh Packaged Spec Builder Sample Assets"
status: "draft"
tags:
  - "spec-builder"
  - "execution-blueprint"
  - "sample"
source_artifacts:
  - "sample-spec-builder-refresh"
  - "sample-spec-builder-refresh-epic"
---

# Execution Blueprint: Refresh Packaged Spec Builder Sample Assets

## Scope
This sample blueprint covers the maintenance work needed to replace placeholder sample assets in the packaged Spec Builder bundle. It excludes changes to renderer code or registry structure.

## Prerequisites
Review the packaged artifact registry and the current skill documents for each supported artifact type. Confirm the canonical sample filenames before updating content.

## Implementation Steps

### Step 1: Inventory packaged samples
Review the registry-declared sample slugs and confirm the packaged `json/` and `markdown/` directories contain matching files.  
Files to modify: `CodeGenerationAgent/src/code_generation_core_agent/spec_builder/source_assets/samples/**`  
Acceptance criteria: the full sample set is accounted for before any edits are made.  
Verification command: `registry review complete`

### Step 2: Refresh JSON examples
Replace placeholder JSON content with valid, linked examples that use current ids, types, and supporting fields.  
Files to modify: `.../samples/json/*.json`  
Acceptance criteria: each sample is realistic and internally consistent.  
Verification command: `json sample review complete`

### Step 3: Refresh Markdown examples
Author representative markdown documents or summaries for each artifact so the packaged examples demonstrate current structure and usage.  
Files to modify: `.../samples/markdown/*.md`  
Acceptance criteria: markdown samples are readable, non-placeholder, and artifact-specific.  
Verification command: `markdown sample review complete`

## Dependencies & Ordering
The JSON roadmap hierarchy should be refreshed before the authored markdown documents so markdown examples can reference stable sample ids and document paths. The related docs can then be updated in parallel.

## Verification Plan
Inspect all sample files for coherence, check that ids and paths line up across the linked artifacts, and confirm the examples reflect the current packaged registry. Edge cases include obsolete type names, stale paths, and mismatched sample ids.

## Risk Notes
The largest risk is schema drift after future registry or skill updates. To reduce that risk, keep these examples compact and easy to update whenever the contract changes.

## Related Artifacts
- `sample-spec-builder-refresh`
- `sample-spec-builder-refresh-epic`
- `sample-author-updated-sample-assets`
- `sample-validate-packaged-samples`
