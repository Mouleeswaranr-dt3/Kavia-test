---
name: ladder_document_format
description: Use only when the user explicitly requests the "ladder" document format or an "L0-to-Ln ladder" structure. Do not use for generic documentation, planning, specification, design, findings, or investigation requests.
owner: system
source_ecosystem: kavia-system
---

# ladder_document_format

## Purpose

Use this skill only when the user explicitly mentions and requests the **ladder** document format, an **L0-to-Ln ladder**, or equivalent ladder-level formatting. The artifact type alone never activates this skill.

Do not infer a ladder request from generic terms such as document, documentation, plan, implementation plan, specification, detailed design, architecture, findings, investigation, analysis, or CodeWiki. When the user has not explicitly requested ladder formatting, do not read or apply this skill and use the artifact’s normal format instead.

The point of the ladder is to REDUCE what a reader must take in. The document is layered so a reader can **stop at any level** and still have a complete, correct understanding at that altitude — they descend only when they want more technical depth. Two payoffs:

- A reviewer skims the top, judges the high-level direction, and **redirects the agent before the deep work is done or read** — instead of discovering a wrong turn buried at line 123143.
- A lazy or time-pressed reader understands the whole document from its headers and top levels alone.

Do not use this skill for structured-data artifacts where the requested format is the product: JSON IR, YAML manifests, config/lock files, schemas, generated registries, or generated index/navigation pages. If the user explicitly asks for a different document structure, follow the user's structure instead.

## How to read this document (the ladder)

The ladder descends from high level to deep detail. **The top is the whole document at its highest altitude; each level down re-expresses the same scope with more technical depth.** Higher levels carry only high-level architectural decisions and direction; lower levels add design, then implementation, then file-level evidence.

Two invariants make the ladder work:

1. **Every level is self-contained at its altitude.** A reader who stops at any level has a complete, correct picture for that depth and never has to read a lower level to understand a higher one. Deeper levels elaborate the same topics the higher levels summarize — they add detail, they never introduce the document's conclusions for the first time.
2. **Lead with the conclusion.** The first sentence of every section states its outcome, and headings are descriptive enough that the document's shape and direction are clear from the headings alone.

## Ladder levels

The number and naming of levels VARY by document purpose — add as many as the content's depth requires, with no maximum. What is invariant is the logic: **only high-level architectural decisions at the top, progressively deeper technical detail at each step down, every level self-contained and reflecting the whole document at its altitude.** Two levels are fixed anchors:

### L0 — Bottom line

`## L0 — Bottom line`, five lines or fewer. The whole document in miniature: the conclusion, recommendation, or direction, and what accepting it costs the reader. Someone who reads only L0 knows the outcome.

### L1 — High-level decisions and open questions

`## L1 — Decisions and open questions`, immediately after L0. Only the **high-level / architectural** decisions, choices, assumptions taken as fact, and open questions — no code, no `file:line`, no low-level mechanics. Prefer a table; for plans, include a `Needs the user's call? (yes/no)` column. This is the level a reviewer uses to catch a wrong direction and redirect early, so it must be self-contained and complete at the architectural altitude.

### L2 and deeper — progressive technical depth

Below L1, each level zooms one step deeper into the SAME content. The levels that fit depend on the document: an implementation plan might descend design and component interactions → implementation specifics → `file:line` evidence, verification logs, and pre-mortems at the deepest; a findings document will differ. Demote `file:line` detail and raw evidence to the deepest levels — it is noise at the top. Every added level must support the levels above it and stay self-contained at its own altitude.

## Provenance convention

Mark factual claims with `(verified)` when they are anchored to source code, test output, command output, logs, or user-provided authoritative requirements. Mark reasoned conclusions with `(inferred)` when they follow from verified facts but are not directly stated in a source. Separate observed symptoms from mechanisms so future agents can tell what was seen from what was concluded.

When citing code, prefer `file:line` anchors and include a short excerpt when the claim depends on exact syntax. When citing command output, include the command and the observed result rather than a paraphrase alone.

## Document-type fit

| Document type | Apply this skill? | Reason |
| --- | --- | --- |
| Any prose document for which the user explicitly requests ladder or L0-to-Ln formatting | yes | The user explicitly selected this document structure. |
| DetailedDesign, FeatureSpec, ArchitectureSpec, implementation plan, findings report, investigation, RCA, narrative test plan without an explicit ladder request | no | Artifact type alone must not activate this skill. |
| CodeWiki architecture, features, onboarding, quality, release notes, or other prose without an explicit ladder request | no | Generic documentation and CodeWiki requests use their normal artifact formats. |
| JSON IR, roadmap JSON, epic/story/test-case JSON, YAML manifests, config files, lock files, schemas, generated registries | no | The requested schema is the artifact contract and should not be wrapped in ladder prose. |
| Markdown index pages, navigation pages, generated tables of contents | no | These pages optimize discoverability and should stay concise and index-shaped. |
| User-requested non-ladder custom format | no | The user’s requested structure applies instead. |

## Output rules

Keep the document's required metadata, breadcrumbs, title, and repository-specific Markdown conventions intact. Apply the ladder inside the body after those required elements. Do not remove required front matter, CodeWiki breadcrumbs, or index-page conventions to force a ladder.

Use descriptive headings; the document's direction must be legible from the headings and first sentences alone. Start every section with its conclusion. Make each level self-contained — a reader must be able to stop at any level with a complete picture at that altitude. Never push the document's conclusions or high-level decisions down into deeper levels; the top must already carry them. Keep `file:line` evidence, code excerpts, and low-level mechanics at the deepest levels, out of the high-level view. Prefer reuse of existing repository conventions over inventing a new document template.

## Non-goals

This skill does not guarantee deterministic activation. It does not introduce `default_for_agents`, mandatory skill semantics, controller `modes` plumbing, frontend settings, or per-document-type prompt templates. It does not modify artifact schemas, generated JSON, manifests, configs, or navigation/index page formats.
