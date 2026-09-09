---
name: generate_dynamic_skill
description: Use when the user explicitly asks to create, add, or generate a reusable persisted skill instruction bundle. Generates dynamic skills in the canonical package format under skills/<safe_name>/ using Skill.md as the instruction entrypoint and .kavia/skill.package.yaml as package metadata.
owner: system
source_ecosystem: kavia-system
slash_command:
  command: generate-skill
  enabled: true
---

# generate_dynamic_skill

Use this system skill only when the user explicitly asks to create, add, define, or generate a reusable persisted skill that should be available in future runs.

This skill describes how to create dynamic skill packages using the current package-based skill system. Dynamic skills are user/workspace-authored packages and must be written as package folders with a top-level `Skill.md` instruction entrypoint.

Descriptions are single-sourced from `Skill.md` YAML front matter. Do not add a
top-level `description` or `summary` field to `.kavia/skill.package.yaml`.

## TRIGGER / ROUTING

Use this skill when the user asks for a persisted reusable skill, for example:

- “Create a skill for reviewing Terraform modules.”
- “Add a reusable skill that handles release note generation.”
- “Generate a new skill for our API documentation workflow.”

Do not use this skill when:

- The user only wants a one-time answer, plan, code change, or documentation update.
- The user asks to edit an existing source file, test, manifest, or application feature rather than create a reusable skill.
- The user asks to migrate or edit Kavia-owned system skills under `system_packages/`; that is a repository maintenance task, not dynamic skill generation.

## DYNAMIC SKILL PACKAGE ON DISK

A newly generated dynamic skill must be emitted as one package directory:

1. `skills/<safe_name>/Skill.md`
2. `skills/<safe_name>/.kavia/skill.package.yaml`
3. Optional package-owned files under `skills/<safe_name>/assets/` or other paths declared in the package manifest when explicitly requested.


## LOCATION CONTRACT

Write generated dynamic skill packages under the project base directory at:

- `skills/<safe_name>/`

Do not invent absolute paths. Always use project-relative paths rooted at `skills/`.



## SAFE NAME / PACKAGE ID RULE

Compute `<safe_name>` from the requested skill name:

- Keep alphanumeric characters.
- Replace every other character with `_`.
- Lowercase the result.

Example:

- Requested skill name: `New Skill Name!`
- Safe name / package id: `new_skill_name_`

Use the same `<safe_name>` consistently for:

- The package folder name.
- The package `id`.

## CANONICAL PACKAGE MANIFEST

Create:

- `skills/<safe_name>/.kavia/skill.package.yaml`

The manifest must include at least:

```yaml
schema_version: kavia.skill_package.v1
id: <safe_name>
name: <Skill Name>
source:
  ecosystem: kavia
entrypoints:
  default:
    file: Skill.md
    format: markdown
files:
  - path: Skill.md
    role: instructions
governance:
  owner: user
  visibility: workspace
  state: enabled
validation:
  status: passed
external_format_version: kavia.native_skill.simple.v1
```

Keep values specific to the requested skill. Do not claim system ownership for dynamic skills. The canonical description must come from `Skill.md` front matter instead of the manifest.

## SLASH-COMMAND METADATA

Only add slash-command metadata when the user explicitly asks for the skill to be user-invokable as a slash command, or when the requested skill is clearly intended to be invoked directly from chat with a command such as `/my-skill`. Do not add slash-command metadata merely because a skill has trigger phrases, because most skills should remain selectable instruction bundles and should not appear in the slash-command registry.

Skill-backed slash commands for generated skills are declared through the `slash_command` object in `Skill.md` YAML front matter. Do not declare slash commands in `.kavia/skill.package.yaml`, `selection.prompt_rendering_hints`, `slash_command=<command-name>`, `command=<command-name>`, or `slash_aliases=<alias-list>` prompt rendering hints.

The command name must be a slash-command token without the leading slash. It must start with a lowercase letter and may contain lowercase letters, numbers, underscores, and hyphens. It must match the registry pattern `^[a-z][a-z0-9_-]{1,63}$`. Keep the command short, specific, and unlikely to conflict with built-in commands such as `help`, `commands`, `status`, `tokens`, `compact`, `reset`, `agent`, `review`, `test`, `docs`, `plan`, `implement`, and `fix`.

When a skill-backed slash command is appropriate, add the command declaration under the top-level `slash_command` object. Include explicit aliases only in `slash_command.aliases`; do not rely on slash-style trigger phrases for command aliases. Aliases must also normalize safely and must not duplicate the primary command or known built-in commands.

Example manifest fragment for a user-invokable skill:

```yaml
selection:
  supported_agents:
    - "DocumentationAgent"
  task_categories:
    - "documentation"
  prompt_catalog_summary: "Generate audit evidence summaries from repository context."
```

Example `Skill.md` front matter fragment for the same user-invokable skill:

```yaml
---
name: audit_evidence
description: Generate audit evidence summaries from repository context.
owner: user
source_ecosystem: kavia
slash_command:
  command: audit-evidence
  aliases:
    - audit-summary
  enabled: true
---
```

Skill-backed slash commands are not direct micro-agent calls. They are routed through the slash-command service and orchestrator with `direct_invocation_allowed` set to false. Do not describe the command as bypassing the orchestrator, launching a direct agent session, or granting direct shell/plugin execution. Do not declare shell-style dynamic execution tools such as `bash`, `shell`, `terminal`, or `subprocess` for a skill that is intended to be registered as a slash command, because the skill command loader rejects those packages.

If the generated skill instructions use template fields for slash-command rendering, only use supported fields: `{arguments}`, `{argument_text}`, `{options}`, `{command_name}`, `{skill_name}`, `{skill_path}`, `{package_id}`, and `{context}`. Do not add arbitrary template fields, because unsupported fields cause command rendering to fail.

## SKILL INSTRUCTION ENTRYPOINT

Create:

- `skills/<safe_name>/Skill.md`

The `Skill.md` file must include YAML front matter followed by durable Markdown instructions.

The front matter must include at least:

```yaml
---
name: <safe_name>
description: <One paragraph describing when to use this skill>
owner: user
source_ecosystem: kavia
---
```

This front matter `description` is the canonical skill description. Do not
duplicate it in `.kavia/skill.package.yaml`.

When a slash command is appropriate, add `slash_command` to this front matter.

The Markdown body must include these sections:

1. `TRIGGER / ROUTING`
   - When to use the skill.
   - When not to use the skill.

2. `Instruction Body`
   - Provide instructions on how to perform the requested task or use the requested skill.
   - Any tools or resources required.
   - Any constraints that must always be followed.
   - Reference any scripts to execute.
   - Reference any files/assets to use.

3. `Assets`
   - If the skill requires package-owned assets (files, scripts, templates, etc.), list them in this section and declare them in the manifest. Otherwise, do not create any assets or reference any files outside of the instruction text.
   - Generate or download the required assets in the created Skills/assets folder.

The instruction entrypoint should be complete, directly usable, and written as durable guidance for future agent turns.

## HARD OUTPUT CONTRACT

When generating a new skill, produce the required skill package files and any required package-owned assets.

Required files:

1. `skills/<safe_name>/Skill.md`
2. `skills/<safe_name>/.kavia/skill.package.yaml`

Do not create indexes, registries, README files, source code changes, legacy dynamic skill files, or unrelated files unless explicitly requested. Do not modify the built-in slash-command registry when creating a dynamic skill. If the skill should be user-invokable as a slash command, declare that intent only in `Skill.md` front matter using `slash_command`.

If package-owned assets are explicitly requested, place them under:

- `skills/<safe_name>/assets/`

and declare them in the `files` list of `.kavia/skill.package.yaml`.

## HOW TO INVOKE

Selection key: `generate_dynamic_skill`

Example user phrasing:

- “Create a reusable skill for generating SOC 2 audit evidence summaries.”
- “Add a skill that helps agents write migration plans for legacy Django apps.”
