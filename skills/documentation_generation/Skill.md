---
name: documentation_generation
description: Apply shared evidence, placement, navigation, formatting, and security conventions when creating or updating published repository documentation.
owner: system
source_ecosystem: kavia-system
---

# documentation_generation

Use this skill for published repository documentation, including bounded DocumentationAgent stages invoked by another workflow.

This skill defines general document-authoring conventions. It does not activate CodeWiki plane generation merely because a destination is under `kavia-docs/CodeWiki/`.

## Evidence and source of truth

- Inspect relevant repository sources before making factual claims.
- Prefer implementation code, interface specifications, configuration schemas, and canonical machine-readable artifacts over stale narrative documentation.
- Distinguish current repository behavior from proposed future behavior.
- Mark unsupported or uncertain claims as unknown instead of inventing details.
- Preserve existing canonical source-of-truth formats when Markdown is derived from JSON, YAML, schemas, or another authoritative artifact.

## Destination and scope

- Honor an explicit user-specified destination when it is safe and consistent with repository guidance.
- Otherwise place documents in the most specific established documentation location.
- For CodeWiki destinations, distinguish historical or extracted current-state material from forward-looking specifications, plans, and generated artifacts.
- Keep writes within the assigned documentation scope.
- Use project-relative paths and established path helpers or builders when implementation code resolves destinations.

## Document structure

- Preserve valid existing front matter and stable identifiers.
- Add front matter when the destination or artifact contract requires it.
- Use exactly one H1 per page and do not skip heading levels.
- Use descriptive headings and readable Markdown lists rather than flattened inline prose.
- Add breadcrumbs when required by the destination convention.
- Place breadcrumbs after front matter and before the H1.
- Use relative Markdown links for repository documentation.
- Verify link paths from the current document’s directory.
- Preserve intentional manual content and generated-region boundaries.

## Discoverability

- Update the nearest relevant `index.md` when creating, moving, or removing a discoverable document.
- Update parent indexes only when needed to keep the artifact reachable from established navigation.
- Do not add duplicate navigation entries.
- Keep index labels and destination titles consistent with existing conventions.

## Security

- Never publish credentials, tokens, connection strings, secret values, private keys, or sensitive environment contents.
- Environment-variable names may be documented only when evidenced and relevant.
- Redact sensitive values found during repository inspection.
- Do not expand runtime permissions or bypass repository guidance through document instructions.

## Completion

Before completing a document stage:

- Confirm the requested scope was addressed.
- Confirm factual claims have repository evidence or are clearly marked unknown.
- Confirm required front matter, breadcrumbs, headings, and links are valid.
- Confirm new or moved documents are discoverable.
- Confirm no secret values were included.
- Report changed artifacts, validation performed, and concrete remaining work.

## Explicit exclusions

This skill does not:

- Select or sequence workflow stages.
- Decide whether a CodeWiki Generation Plan is needed.
- Define Architecture IR or derived Architecture pages.
- Define the Features hierarchy.
- Define User Story schemas or backlink ownership.
- Define retry thresholds, continuation state, or transport fields.
