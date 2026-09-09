---
slash_command:
  command: kdiff-query
  enabled: true
---

# kdiff-{value}

=== Kdiff_query skill prompt ===

Use the `KDiffQueryTools_kdiff_query` tool to get rich, detailed information pertaining to questions relating to differences between baseline and new versions of codebases.

If the performance of your overall task requires or would benefit from detailed information about differences between codebase versions, invoke the `KDiffQueryTools_kdiff_query` tool with:

- `name`: `{value}`
- `query`: a description of the question or questions you have.

This conditional system skill is rendered from runtime `kdiffs` context. The `{value}` placeholder is intentionally preserved in the bundled package and is filled when the package is selected for a specific kdiff context item.
