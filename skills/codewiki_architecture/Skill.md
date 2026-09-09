---
name: codewiki_architecture
description: Use ONLY when the user explicitly mentions "CodeWiki" and requests updates to the CodeWiki Architecture plane (IR + derived pages) under kavia-docs/CodeWiki/Architecture/**; exclude generic architecture/documentation requests.
owner: system
source_ecosystem: kavia-system
slash_command:
  command: codewiki-architecture
  enabled: true
---

# codewiki_architecture

=== CodeWiki Architecture Plane Maintenance Skill (Source-of-truth aligned with original ArchitectureExtractionAgent prompt) ===

TRIGGER / ROUTING (STRICT)
- Use this skill ONLY when the user explicitly mentions "CodeWiki" (case-insensitive) AND the request is to create/update the CodeWiki Architecture plane.
- If the user does NOT explicitly say "CodeWiki", DO NOT use this skill (even if they ask for "architecture documentation", "system architecture", "C4 model", "Markdown docs", etc.).
- For generic architecture documentation requests (not explicitly CodeWiki), use DocumentationAgent.

This skill is ONLY for generating/updating the CodeWiki Architecture plane artifacts under:
- kavia-docs/CodeWiki/Architecture/**
- kavia-docs/CodeWiki/index.md (shared unified CodeWiki index)

It is NOT a general-purpose "write an architecture document" capability.

This skill generates and maintains the "Architecture plane" of the CodeWiki, including:
1) Architecture IR JSON (machine-readable source of truth)
2) CodeWiki Architecture-plane Markdown pages derived with that IR as the starting point and code as the normative source (under kavia-docs/CodeWiki/Architecture/**)

HARD OUTPUT CONTRACT (CRITICAL)
- Write ONLY under:
  - kavia-docs/CodeWiki/Architecture/**
  - kavia-docs/CodeWiki/index.md (shared unified CodeWiki index)
- ALWAYS produce architecture IR JSON at:
  - kavia-docs/CodeWiki/Architecture/ir.json
- NEVER include actual secret values; environment variable NAMES only (e.g., OPENAI_API_KEY).
- Markdown documents MUST be derived strictly from IR fields and code. 
- Prefer Mermaid diagrams when diagrams are needed.
- Preserve manual content outside clearly marked GENERATED blocks where possible (if the implementation supports generated-region updates).

FORMAT / MODE CONTROL (MANDATORY)
request_details.architecture.format may be:
- "json": write ir.json (and optional JSON indices). Minimal markdown allowed (index + system-context stub) but MUST still include front matter if written.
- "md": read existing ir.json and generate markdown derived from IR and code. Do not fabricate information not from these sources
- "both": do json first, then md generation.

1) IR JSON MODEL (MANDATORY STRUCTURE)
The IR MUST conform to this top-level structure (fields may be empty arrays/objects but must exist):

{
  "systemContext": {
    "actors": [
      { "id": "", "name": "", "type": "person|system", "permissions": [] }
    ],
    "externalSystems": [
      { "id": "", "name": "", "type": "softwareSystem", "interfaces": [] }
    ],
    "highLevelFlows": [
      {
        "id": "",
        "name": "",
        "trigger": { "type": "actor|schedule|event|api", "ref": "" },
        "steps": [
          {
            "n": 1,
            "from": { "t": "actor|container|externalSystem", "ref": "" },
            "to": { "t": "container|externalSystem", "ref": "" },
            "i": { "k": "http|grpc|event|queue|db|file|stream", "p": "", "e": "", "v": "" },
            "data": { "class": "public|internal|confidential|restricted", "objs": [] }
          }
        ]
      }
    ]
  },

  "containers": [
    {
      "id": "",
      "name": "",
      "type": "webApp|mobileApp|desktopApp|api|worker|cli|db|cache|messageBroker|pipeline|mlService|other",
      "tech": { "lang": "", "fw": "", "rt": "" },

      "if": {
        "prov": [
          { "id": "", "k": "http|grpc|pub|prod|dbw|filew|other", "p": "", "e": [], "auth": "" }
        ],
        "req": [
          { "id": "", "k": "http|grpc|sub|cons|dbr|filer|other", "p": "", "e": [], "auth": "" }
        ]
      },

      "deps": [
        { "to": { "t": "container|externalSystem", "ref": "" }, "k": "sync|async|data", "p": "" }
      ],

      "runtime": {
        "cfg": [ { "k": "", "src": "env|file|secret|cfgsvc", "req": true } ],
        "obs": { "logs": false, "metrics": false, "traces": false }
      },

      "components": [
        {
          "id": "",
          "name": "",
          "type": "controller|service|module|repo|adapter|client|consumer|producer|job|scheduler|ui|other",
          "src": { "path": "", "sym": [], "entry": [] },

          "if": { "prov": [], "req": [] },
          "deps": [ { "ref": "", "k": "call|event|data|other" } ],

          "data": [
            { "eng": "", "sch": "", "tbl": [], "ops": ["r","w","u","d"], "models": [] }
          ],

          "sub": [
            { "id": "", "name": "", "type": "class|fn|pkg|feature|other", "src": { "path": "", "sym": [] }, "deps": [] }
          ],

          "tests": [ { "t": "unit|int|e2e", "paths": [] } ]
        }
      ]
    }
  ],

  "components": [
    { "id": "", "ctr": "", "cmp": "" }
  ],

  "deployment": {
    "environments": [
      { "id": "", "name": "local|dev|staging|prod", "region": "" }
    ],
    "nodes": [
      { "id": "", "env": "", "type": "k8s|vm|serverless|edge|other", "provider": "", "region": "" }
    ],
    "services": [
      {
        "id": "",
        "env": "",
        "node": "",
        "ctr": "",
        "artifact": { "t": "image|lambda|binary|static|other", "ref": "", "ver": "" },
        "ports": [],
        "envvars": [],
        "secrets": [],
        "deps": []
      }
    ],
    "networks": [
      { "id": "", "env": "", "cidr": "", "policies": [] }
    ],
    "ingresses": [
      {
        "id": "",
        "env": "",
        "type": "lb|apigw|ingress|cdn|other",
        "hosts": [],
        "routes": [ { "path": "", "methods": [], "to": "", "auth": "" } ],
        "tls": false
      }
    ],
    "scaling": [
      { "id": "", "env": "", "svc": "", "t": "hpa|keda|manual|other", "min": 1, "max": 1, "metrics": [] }
    ]
  },

  "databaseSchema": {
    "engines": [
      { "id": "", "type": "postgres|mysql|mssql|sqlite|mongodb|dynamodb|neo4j|redis|other", "ver": "", "deploy": { "env": "", "svc": "" } }
    ],
    "schemas": [
      { "id": "", "eng": "", "name": "" }
    ],
    "tables": [
      { "id": "", "sch": "", "name": "", "cols": [ { "n": "", "t": "", "nul": true, "pk": false, "uq": false } ] }
    ],
    "relations": [
      { "id": "", "from": "", "to": "", "type": "1:1|1:n|n:n", "fk": { "from": "", "to": "" } }
    ]
  },

  "decisions": [
    { "id": "", "title": "", "status": "proposed|accepted|rejected|deprecated", "date": "", "decision": "", "alts": [] }
  ],

  "constraints": [
    { "id": "", "type": "security|compliance|performance|platform|data|org|other", "statement": "", "refs": [] }
  ],

  "risks": [
    { "id": "", "title": "", "likelihood": "low|med|high", "impact": "low|med|high", "mitigations": [], "refs": [] }
  ],

  "openQuestions": [
    { "id": "", "q": "", "owner": "", "status": "open|answered|wontfix", "refs": [] }
  ],

  "diagrams": [
    { "id": "", "type": "c4_context|c4_container|c4_component|deployment|sequence|dataflow|other", "fmt": "mermaid|plantuml|dsl|image|other", "src": "" }
  ]
}

EVIDENCE REQUIREMENT (CRITICAL)
- Every major IR element and conclusion SHOULD include evidence references:
  - evidence[]: { path, lines?, reason? }
- If uncertain about a framework/type/engine, set field to "unknown" and record evidence.reason.

2) ARCHITECTURE DOCS DIRECTORY STRUCTURE (MANDATORY)
All architecture docs MUST live under kavia-docs/CodeWiki/Architecture/. Use
the following consolidation-aware structure:

- Primary navigation entry point:
  - kavia-docs/CodeWiki/Architecture/index.md
- System context:
  - kavia-docs/CodeWiki/Architecture/system-context.md
- IR:
  - kavia-docs/CodeWiki/Architecture/ir.json
- Containers (one overview page per detected container):
  - kavia-docs/CodeWiki/Architecture/containers/<container-id>/overview.md
- Optional container topic pages (ONLY when the topic has enough substantive,
  independently useful content to justify a separate page):
  - kavia-docs/CodeWiki/Architecture/containers/<container-id>/components.md
  - kavia-docs/CodeWiki/Architecture/containers/<container-id>/interfaces.md
  - kavia-docs/CodeWiki/Architecture/containers/<container-id>/data-flows.md
  - kavia-docs/CodeWiki/Architecture/containers/<container-id>/dependencies.md
  - kavia-docs/CodeWiki/Architecture/containers/<container-id>/decisions.md
  - kavia-docs/CodeWiki/Architecture/containers/<container-id>/risks.md
- Components (optional, if produced as standalone pages):
  - kavia-docs/CodeWiki/Architecture/components/<component-id>.md
- Deployment:
  - kavia-docs/CodeWiki/Architecture/deployment/deployment-diagram.md
  - kavia-docs/CodeWiki/Architecture/deployment/environments.md
- Database:
  - kavia-docs/CodeWiki/Architecture/database/schemas.json (optional JSON slice)
  - kavia-docs/CodeWiki/Architecture/database/er-diagram.md
- Decisions index (optional but recommended when decisions exist):
  - kavia-docs/CodeWiki/Architecture/decisions/decisions.md

Use kebab-case IDs for container/component filenames derived from stable entity ids.

CONSOLIDATION PRINCIPLE (MANDATORY)
- Optimize for a compact set of substantive architecture pages, not a direct
  one-file-per-IR-node or one-file-per-topic projection.
- The default page boundaries are one Architecture index, one system-context
  page, and one overview page per substantive container.
- By default, consolidate a container's components, interfaces, dependencies,
  flows, data access, configuration, decisions, constraints, and risks into its
  overview page.
- Create a dedicated container topic page only when the available evidence
  produces a substantial section that is difficult to navigate inline or has
  clear independent value.
- Document components inline within the parent container overview by default.
  Create standalone component pages only under the criteria in section 4.4.
- Do not create title-only, metadata-only, placeholder, stub, or near-empty
  topic/component pages merely because a corresponding IR array or page path
  exists in this skill.
- Empty IR arrays do not require empty Markdown pages or sections.
- Preserve existing substantive standalone pages unless consolidation clearly
  improves navigation without losing manual content.

3) YAML FRONT MATTER + BREADCRUMBS (MANDATORY FOR ALL MARKDOWN FILES)
Each Markdown file MUST start with YAML front matter delimited by '---'.

Front matter MUST include at least:
- id: stable id (entity id or logical page id)
- type: lower-case document type (e.g., architecture-index, system-context, container-overview, component, deployment-diagram, database-er-diagram, decisions-index)
- title: optional but recommended
- description: optional
- tags: optional list
- container_id / component_id: when relevant

Immediately after the closing '---', emit a breadcrumb line (except the Architecture index which may omit breadcrumb).

Breadcrumb requirements for CodeWiki architecture:
- Breadcrumb MUST include a link back to unified CodeWiki index:
  - [CodeWiki](../index.md) (or correct relative path)
- Breadcrumb MUST include a link back to Architecture index:
  - [Architecture](index.md) (or correct relative path)

Breadcrumb patterns (compute relative paths correctly):
- Architecture/index.md:
  - May omit breadcrumb (root of architecture plane), but MUST include front matter + H1.
- Architecture/system-context.md:
  - [CodeWiki](../index.md) / [Architecture](index.md)
- Files under Architecture/containers/<container-id>/...:
  - [CodeWiki](../../index.md) / [Architecture](../index.md) / [System Context](../system-context.md)
  (Note: compute correctly; do not blindly copy this example if your file depth differs.)
- Files under Architecture/components/:
  - [CodeWiki](../index.md) / [Architecture](index.md) / [System Context](system-context.md) / [Container: <name>](containers/<container-id>/overview.md)
  (Compute relative paths; example shown as conceptual.)
- Files under Architecture/deployment/ or Architecture/database/ or Architecture/decisions/:
  - [CodeWiki](../index.md) / [Architecture](index.md) / [System Context](system-context.md)
  (Compute relative paths from subfolder.)

4) MARKDOWN CONTENT REQUIREMENTS 
4.1) Architecture index (Architecture/index.md)
MUST include:
- H1: # Architecture
- Short description
- TOC sections:
  - Overview (link to system-context.md)
  - Containers (bullet list linking to containers/<id>/overview.md)
  - Deployment (links only when substantive deployment documentation exists)
  - Database (links only when substantive database documentation exists)
  - Decisions (link only when a decisions page exists)

4.2) System context (system-context.md)
Derived from ir.systemContext:
- H1: # System Context
- Sections:
  - ## Overview
  - ## Actors
  - ## External Systems
  - ## High-Level Flows
  - ## Diagrams (Mermaid from ir.diagrams where type indicates context)

4.3) Container documents (per ir.containers[])
Generate one overview.md per substantive container. It should consolidate the
following evidenced content where available:

- overview.md:
  - ## Overview / Responsibilities
  - ## Technical Profile (language/framework/entrypoints/ports)
  - ## Configuration and Environment (env var names only)
  - ## Components (inline summaries by default; links only for justified
    standalone component pages)
  - ## External interfaces for the container
  - ## Dependencies
  - ## Data Flows
  - ## Data Stores
  - ## Decisions, Constraints, and Risks
  - ## Diagrams (when evidenced and useful)
  - ## Container details (links only to substantive topic pages that exist)
  - ## Related / See also (index/system context/other container pages)

Omit optional sections that have no meaningful evidence instead of emitting
empty headings.

Dedicated topic pages are optional:
- components.md: use only when substantive component detail would make the
  inline Components section difficult to scan.
- interfaces.md: use only for a substantial interface surface with meaningful
  contracts, protocols, authentication, endpoints/topics, and relationships.
- data-flows.md: use only for multiple detailed flows or diagrams requiring
  independent explanation.
- dependencies.md: use only for a complex dependency topology requiring more
  than a concise overview section.
- decisions.md: use only when several evidenced decisions materially affect
  this container and warrant focused treatment.
- risks.md: use only when several evidenced risks or constraints warrant
  focused treatment.

A single list, short paragraph, empty IR array, or navigation-only body is not
sufficient justification for any dedicated topic page.

4.4) Component pages (optional, consolidation-first)
- Default: document each component as an H3 subsection under the parent
  container overview's "## Components" section.
- Each inline component should retain its stable component ID and summarize its
  responsibility, source evidence, interfaces, dependencies, and data access as
  available.
- Create a standalone component page only when at least one condition is met:
  - it has multiple substantive responsibilities or subcomponents requiring
    detailed explanation;
  - it exposes a significant public API or interface surface;
  - it has substantial independent data access, workflows, configuration,
    dependencies, failure modes, or test evidence;
  - it is shared across architectural concerns and needs one canonical page;
  - an existing substantive component page should be preserved;
  - the user or runtime request explicitly requires a standalone page.
- A component name, source path, symbol list, one-sentence responsibility, or
  parent relationship alone is NOT sufficient justification.
- Standalone pages should cover overview, source files, public APIs, data
  access, dependencies, decisions/risks/constraints, tests, and related links
  where evidenced.

4.5) Deployment docs
Derived from ir.deployment + diagrams:
- Prefer one consolidated deployment page when available evidence is modest.
- deployment-diagram.md: create when there is an evidenced topology or useful
  Mermaid diagram plus explanatory narrative.
- environments.md: create only when multiple environments or meaningful
  environment-specific differences are evidenced.
- Do not create either page solely to state that deployment information was not
  detected; record important uncertainty in the system context or IR instead.

4.6) Database docs
Derived from ir.databaseSchema:
- er-diagram.md: create only when evidenced schemas, tables/models, or relations
  support a useful Mermaid ER-ish diagram and narrative.
- schemas.json (optional): slice of databaseSchema
- For modest data-access evidence, keep the information in the relevant
  container overview rather than creating a sparse database page.

4.7) Decisions index (optional)
If ir.decisions[] exists:
- decisions/decisions.md listing decisions, status, date, links to affected containers.

5) CROSS-LINKING (MUST MIRROR FEATURE STYLE)
- Parent↔child links:
  - system-context links to each container overview
  - container overview links back to system-context
  - container overview or components.md links to component pages (if present)
  - component pages link back to container overview
- Link only to pages that exist and contain substantive content.
- Do not manufacture a child page solely to satisfy a navigation list.
- Each page SHOULD end with a "## Related" or "## See also" section with relative links.

6) FAIL-SAFE BEHAVIOR
- If no containers/elements found:
  - Always still write a valid ir.json with empty arrays/objects.
  - Generate skeletal index.md and system-context.md noting that detection was empty/incomplete.
  - Do not generate empty container, component, deployment, database, decision,
    interface, dependency, flow, or risk pages.
- If request_details.architecture.failOnEmpty is true:
  - Still emit the empty IR + skeletal docs (do not crash output format).

7) ENVIRONMENT VARIABLE POLICY
- Only names of env vars may be listed in IR/docs, never values.
- Example allowed: ["OPENAI_API_KEY", "NEO4J_CONNECTION_URI"].

8) COMPLETION, EVIDENCE, AND WORKFLOW HANDOFF

Complete only the bounded Architecture objective assigned by the workflow. Do not
run an internal loop, require fixed phases, or emit a private state protocol.

8.1) OBSERVABLE COMPLETION CRITERIA
- `Architecture/ir.json` exists and conforms to the required top-level schema for
  generation work, or a targeted Markdown-only repair has explicitly established
  that the existing IR remains authoritative and does not require regeneration.
- Every changed architectural fact is supported by repository evidence. Unknown
  facts remain `unknown` and include the inspected source and reason for uncertainty.
- Markdown changed by the stage agrees with the relevant IR entities and repository
  evidence.
- Required substantive pages for the bounded scope are linked from the
  Architecture index or appropriate parent page.
- Every selected IR component is covered inline in its container overview or by
  a justified standalone page; a one-to-one IR-to-file mapping is not required.
- No standalone topic or component page exists only for structural symmetry.
- Breadcrumbs, relative links, stable entity IDs, and parent-child references in
  the changed scope are valid.
- No secret value or out-of-scope plane content is written.

8.2) Comprehensive generation criteria
- Confirm container boundaries, entry points, provided and required interfaces,
  dependencies, runtime configuration names, data access, and high-level flows to
  the extent supported by inspected evidence.
- Inspect enough distinct implementation and interface artifacts to support each
  material conclusion; evidence quality and closure determine completion, not a
  fixed number of iterations or files.
- If evidence cannot close a required field, add an `openQuestions` entry, mark
  the field unknown where applicable, and identify what was inspected.
- Create or refresh the selected derived Markdown pages only after the relevant IR
  content is authoritative.
- Consolidate components, interfaces, dependencies, flows, data concerns,
  decisions, constraints, and risks into container overviews by default.
- Create standalone topic and component pages only when sections 2, 4.3, and
  4.4 justify them.
- Do not create sparse pages to mirror every IR node or array.

8.3) Targeted maintenance criteria
- A targeted Markdown, navigation, or link repair must not force full IR regeneration
  when the defect can be corrected consistently from the existing IR and repository
  evidence.
- A targeted IR correction updates only affected derived pages and references.
- During Markdown repair, identify near-empty topic and component pages. Merge
  their useful content into the parent container overview, update inbound links,
  and remove redundant pages when manual content will not be lost.

8.4) Ordinary workflow handoff
- Finish with ordinary Markdown reporting the stage outcome, bounded objective,
  changed artifacts, evidence and validation performed, concrete remaining work,
  blockers, and recommended next action.
- Recommend continuation only when required work remains concrete, bounded, and
  likely to produce material evidence or artifact progress.
- Do not emit `PASS_STATE`, pass names, iteration counters, or fixed page-count
  thresholds.

9) MARKDOWN STRUCTURE AND MKDOCS RENDERING RULES (MANDATORY)
These rules exist to prevent malformed Markdown that renders poorly in MkDocs. Follow them strictly.

9.1) Headings (strict)
- Exactly one H1 per page:
  - Architecture index: H1 must be "# Architecture"
  - System context: H1 must be "# System Context"
  - Container overview: H1 should be the container name (or "Container: <Name>") but be consistent across that container’s docs.
  - Other pages: H1 should be the page’s primary subject (e.g., "Deployment", "Database ER Diagram", "Decisions").
- Do NOT skip heading levels:
  - H1 (#) → H2 (##) → H3 (###)
  - Never jump from H1 directly to H3.
- Do not create “inline headings” like:
  - "## Containers: ..." or "## Actors: ..." (FORBIDDEN)
  Use plain titles only ("## Containers", "## Actors"), then content below.

9.2) Blank lines (strict)
- YAML front matter must be followed by:
  - Breadcrumb line (MANDATORY)
  - blank line
  - H1
  - blank line
- Always include ONE blank line:
  - before every heading
  - after every heading
  - before and after every bullet list
  - between consecutive lists and paragraphs
- Do not place list items immediately after a colon without a blank line.

9.3) Lists (strict)
- Use "-" bullet lists only (not "*" or "+") for consistency.
- Each list item MUST be on its own line.
- Index and navigation lists MUST NOT be flattened into prose.
  FORBIDDEN examples:
  - "Containers include api, web, db" (FORBIDDEN)
  - "- api - web - db" (FORBIDDEN)
  - "- [api](...) [web](...) [db](...)" (FORBIDDEN)
- Prefer “one entity per bullet” lists for:
  - containers lists
  - actors lists
  - external systems lists
  - decisions lists
  - open questions lists
- Components may be substantive H3 subsections in a container overview; do not
  force them into linked bullet lists or standalone files.

9.4) Prohibited “flattened inline prose” patterns (FORBIDDEN)
To ensure MkDocs renders cleanly, do NOT output:
- Entire-page prose with no headings beyond the H1.
- Headings immediately followed by another heading (empty section).
- “Sentence soup” that embeds multiple subsections inline, e.g.:
  - "## Containers api: ... web: ... db: ..." (FORBIDDEN)
- Multiple conceptual sections merged into a single paragraph (e.g., overview + lists + related links all combined).

9.5) Link formatting (strict)
- Links must be standard Markdown links: [Text](relative/path.md)
- No HTML anchors, no raw URLs, no absolute filesystem paths, and no leading '/'.
- Compute relative paths correctly; do not hardcode example breadcrumb paths without verifying depth.

If you are modifying an existing file that violates these rules, refactor its Markdown structure to comply while preserving IDs and meaning.
