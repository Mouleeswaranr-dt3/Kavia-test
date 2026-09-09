---
name: create_workspace_workflow
description: Create reusable workspace workflows in the project's .kavia/workflows directory, without modifying Kavia-owned system workflow packages.
owner: system
source_ecosystem: kavia-system
---

# create_workspace_workflow

Use this system skill when the user asks to create a reusable project/workspace workflow. Workspace workflows are project-owned Markdown workflow assets stored under `.kavia/workflows`; they are not Kavia system workflows and must not be added to any source-packaged system workflow directory.

## TRIGGER / ROUTING

Use this skill when the user asks to:

- Create a workflow for a project or workspace.
- Add a reusable project-specific sequence of agent stages.
- Define an automated workflow that should be discovered from `.kavia/workflows`.
- Create a non-system workflow for a repository.

Do not use this skill when:

- The user asks to create or change a Kavia-owned system workflow.
- The user only needs a one-time plan, implementation, or checklist.
- The user asks to create a reusable skill package rather than a workflow.
- The requested workflow is intended for a different destination than the active workspace.

## Workspace workflow location

Create every workspace workflow at:

```text
.kavia/workflows/<workflow-name>.md
```

Use a lowercase, hyphen-separated `<workflow-name>` that describes the workflow’s purpose, such as:

```text
.kavia/workflows/security-review.md
.kavia/workflows/release-readiness.md
.kavia/workflows/legacy-api-migration.md
```

Do not create workspace workflows in:

- `workflows/`
- source-packaged system workflow folders
- a system skill package
- a user home directory
- temporary, cache, or generated-output folders

The authoritative workspace workflow destination is `.kavia/workflows`. Do not create a backward-compatible copy in the legacy `workflows/` directory.

## Required catalog metadata

Every workflow file **must begin on its first line** with YAML frontmatter in exactly this minimal form:

```yaml
---
name: <workflow-name>
description: <Concise user-facing summary of when to use this workflow and what it produces.>
---
```

Catalog discovery rejects workflows unless all of these requirements are satisfied:

- `name` and `description` are both present and non-empty.
- `name` is lowercase, begins with a letter, and contains only lowercase letters, digits, and hyphens (`^[a-z][a-z0-9-]*$`).
- The file name matches the `name` exactly: `.kavia/workflows/<name>.md`.
- The opening `---` is the first line, and the frontmatter has a closing `---` line before the Markdown body.

Do not omit the frontmatter, substitute a Markdown title for metadata, or use unsupported metadata formats. Additional metadata may be included for human readability, but catalog discovery uses only `name` and `description`.

## Creation process

1. Identify the intended outcome, audience, and trigger for the workflow.
2. Choose a clear kebab-case workflow name.
3. Inspect existing workspace workflows in `.kavia/workflows` to avoid duplicate purposes or names.
4. Create one Markdown file at `.kavia/workflows/<workflow-name>.md` whose frontmatter `name` is exactly `<workflow-name>`.
5. Start the file with valid required YAML frontmatter, including a concise `description`.
6. Give the workflow a descriptive Markdown title and concise purpose statement after the frontmatter.
7. Define ordered stages that are independently actionable.
8. For every stage, specify:
   - the responsible agent or role;
   - required inputs and repository context;
   - the work to perform;
   - expected output artifacts;
   - validation or completion criteria.
9. State how the workflow handles failures, blocked dependencies, and missing inputs when relevant.
10. Keep workspace-specific assumptions inside the workflow rather than changing system workflow packages.
11. Ensure every stage produces an explicit output artifact or clearly documented decision before the next stage begins.

## Recommended workflow document structure

Use this structure unless the project already has a more specific established workspace-workflow format:

```markdown
---
name: <workflow-name>
description: <Concise user-facing summary of when to use this workflow and what it produces.>
---

# <Workflow Title>

## Purpose

<What this workflow achieves and when to use it.>

## Preconditions

- <Required inputs, access, or repository state.>

## Workflow

### Stage 1: <Stage name>

**Responsible:** <Agent or role>

**Inputs:**
- <Required context or files.>

**Actions:**
1. <Concrete action.>

**Expected outputs:**
- <Artifact, implementation result, report, or decision.>

**Completion criteria:**
- <How to know the stage is complete.>

### Stage 2: <Stage name>

...
```

Add a final section when useful:

```markdown
## Failure handling

- <How to report or resolve a failed or blocked stage.>
```

## Authoring standards

- Make stages sequential and unambiguous.
- Use explicit artifact names and destination paths whenever the workflow creates files.
- Do not promise actions that the designated agent cannot perform.
- Keep stage instructions specific enough for another agent to execute without guessing.
- Do not embed credentials, secrets, or environment-variable values.
- Prefer project-relative paths.
- Describe asset-directory copying with Python `shutil` where applicable; do not prescribe shell `cp -R`, which may be unreliable in Docker or runtime environments.
- Keep the workflow focused on the requested project activity; do not add unrelated governance, deployment, or preview steps.
- Do not start or stop previews unless the workflow explicitly requires it and the relevant project guidance permits it.

## Completion checklist

Before completing a workspace workflow request, confirm that:

- The workflow file is under `.kavia/workflows/`.
- The file name is lowercase and hyphen-separated, begins with a letter, and matches the frontmatter `name` exactly.
- YAML frontmatter is the first content in the file and has opening and closing `---` delimiters.
- The frontmatter has non-empty `name` and `description` values.
- The workflow is not a system workflow and does not modify system workflow source packages.
- Each stage has a responsible role, actions, expected outputs, and completion criteria.
- The workflow includes only instructions relevant to the stated purpose.
- Any required project-specific paths or artifacts are explicit.
