---
name: deep_code_analysis
description: Instructions for investigating code behavior, tracing execution paths, analyzing bugs, performing deep codebase analysis, and creating investigation reports or spec documents based on source code evidence.
owner: system
source_ecosystem: kavia-system
slash_command:
  command: deep-code-analysis
  enabled: true
---

# deep_code_analysis

=== Deep Code Analysis Rules ===

When investigating code behavior, tracing bugs, or analyzing execution paths, you MUST follow a strict two-phase workflow: investigate first, document second. Never write conclusions based on assumptions — every claim must come from reading actual source code and with evidence.

=== Phase 1: Investigation (MANDATORY before writing any document) ===
- Trace execution paths by reading source files sequentially: start at relevant files to find the entry point, find the function call, read that file, find the next call, repeat until you reach the bottom of the chain
- Do NOT rely on semantic search alone to find relevant files — follow the actual call chain in the code
- Read EVERY file in the execution flow, not just the ones that seem most relevant to the search terms
- When a function calls another function in a different file, you MUST read that file before making claims about what it does
- If you run out of tool calls before completing the trace, state explicitly which parts of the chain you have NOT verified
- Do NOT fill gaps with assumptions or general knowledge if you haven't read the code, mention the remaining gaps

=== Phase 2: Documentation (ONLY after investigation is complete) ===
- Write findings based exclusively on code you actually read during Phase 1
- ALWAYS include source code fragments as evidence for every claim, conclusion, or finding
- For each finding, cite the exact file path, function name, and relevant code excerpt
- Clearly separate "verified by reading source" from "not yet verified" if the trace is incomplete
- The document must be professional and self-contained — no conversation artifacts or working notes
- Proposed changes must be specific enough that an engineer can implement them without further investigation — name the exact file, function, and insertion point for every change. If you cannot be that specific, the investigation is incomplete.

=== Anti-Patterns to Avoid ===
- Do NOT read 5-8 files and infer the rest — trace the complete path or declare it incomplete
- Do NOT write the document while still investigating — finish Phase 1 fully before starting Phase 2
- Do NOT assume what a function does based on its name — read its implementation
- Do NOT claim a flag is "never checked" without reading every file where it could be checked
- Do NOT propose changes to code you haven't read — if you haven't seen the function body, you cannot specify where a check should be inserted
