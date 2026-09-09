# Sample Test Case

**ID:** `sample-validate-packaged-samples`  
**Type:** `spec_builder.test_case`  
**Test type:** `acceptance`  
**Parent story:** `sample-author-updated-sample-assets`

## Objective
Verify that packaged Spec Builder sample assets are realistic, current, and internally consistent.

## Preconditions
- The packaged sample directories contain the expected JSON and Markdown files.
- The registry still points at the canonical `_samples` destinations for each artifact type.

## Steps
1. Review every packaged sample JSON file for correct ids, types, and realistic metadata.
2. Review every packaged sample Markdown file for meaningful structure and non-placeholder prose.
3. Cross-check links between roadmap, epic, story, test case, and authored spec examples.

## Expected Results
All sample artifacts can be used as trustworthy examples for maintainers and downstream tooling without relying on outdated field names or placeholder text.
