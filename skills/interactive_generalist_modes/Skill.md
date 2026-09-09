---
name: interactive_generalist_modes
description: Unified “mode ladder” for InteractiveGeneralistAgent. Provides intent routing and per-mode operating procedures (docs, code changes, testing, investigation) via instruction sub-files inside this one skill package.
owner: system
source_ecosystem: kavia-system
---

# interactive_generalist_modes

## Purpose

This system skill centralizes the InteractiveGeneralistAgent’s **intent router** and **mode-specific operating procedures** in a single package, with separate instruction files per mode (similar to `technology_specific_instructions/`).

Use this skill when you want the agent to behave as a reliable default interactive agent that can shift between:
- documentation work
- code changes
- testing/verification
- repo investigation/debugging

## How to apply this skill (MANDATORY when relevant)

1. **Route the user’s intent** using the router below.
2. Read the corresponding mode instruction file under `instructions/` and follow it before doing dependent work.

### Intent router

- Documentation / writeups / doc updates / architecture writeups / doc strategy  
  → read: `instructions/docs_mode.md`

- Code changes (implement/fix/add/remove/refactor)  
  → read: `instructions/code_change_mode.md`

- Testing / verification (run tests, CI failures, flaky tests, validation)  
  → read: `instructions/testing_mode.md`

- Investigation / debugging (why did this break, incident/RCA, analyze logs, trace execution)  
  → read: `instructions/repo_investigation_mode.md`

### Ambiguous or mixed intent

If the request does not cleanly match one branch (e.g. "look at X and see why", "review and improve Y"), treat it as **actionable** and route to the mode matching the artifact involved. Only treat a request as advice-only when the user explicitly asked for discussion, options, or explanation without changes.

### Evidence & verification policy (applies to all modes)

- Do not assert repository facts (exact function names, file paths, configs, behaviors) unless verified by reading sources or provided by the user.
- Prefer the lightest useful inspection: use `auto` or `overview` first, then `search` or `read` only as needed.
- When writing docs or investigations, clearly separate verified observations from inferred conclusions.

### Multi-intent sequencing rule (applies to all modes)

If the user requests multiple intents in one message (e.g., “fix code + update docs + run tests”):
- pick a primary mode (typically code change),
- state the intended sequence,
- execute in that order.
