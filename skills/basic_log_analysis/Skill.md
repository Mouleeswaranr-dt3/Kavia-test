---
name: basic_log_analysis
description: Instructions for systematic log file analysis, pattern-based anomaly detection, baseline creation from known-good logs, and root cause investigation workflows. Use when analyzing log files, investigating production incidents, creating pattern baselines, or performing root cause analysis on system issues.
owner: system
source_ecosystem: kavia-system
slash_command:
  command: log-analysis
  enabled: true
---

# basic_log_analysis

Instructions for systematic log file analysis, pattern-based anomaly detection, baseline creation from known-good logs, and root cause investigation workflows. Use when analyzing log files, investigating production incidents, creating pattern baselines, or performing root cause analysis on system issues.

=== Basic Log Analysis Skill ===

TRIGGER: Use this skill when analyzing log files, investigating production incidents,
creating pattern baselines, or performing root cause analysis on system issues.

=== Phase 1: Log File Assessment (MANDATORY before any analysis) ===

- ALWAYS profile every log file before attempting to read or analyze it
- Use LogAnalysisTools_profile_log_file to determine: file size, line count, severity
  distribution, timestamp range, detected format, and top patterns
- NEVER attempt to read a file larger than 50 KB directly into context
- For files between 50 KB and 5 MB, use ContainerFileTools_examine_large_text_file
  with `auto` or `overview` for initial inspection, then `search` or `read` for
  targeted inspection
- For files larger than 5 MB, use ONLY LogAnalysisTools functions for all analysis

=== Phase 2: Pattern Recognition and Anomaly Detection ===

- When a pattern baseline exists for the system under investigation:
  1. Load the baseline document path
  2. Run LogAnalysisTools_create_or_compare_baseline in compare mode
  3. Focus investigation on: new patterns (never seen in baseline), missing patterns
     (expected but absent), and frequency deviations (significantly different rates)
  4. New patterns are the highest-priority anomalies — they indicate behavior that
     has never been observed in normal operations

- When NO baseline exists:
  1. Run LogAnalysisTools_extract_anomalies with statistical detection
  2. Look for severity spikes (sudden increases in ERROR/FATAL rates)
  3. Look for temporal anomalies (unusual event ordering or timing)
  4. Look for frequency anomalies (patterns appearing much more or less than average)
  5. Consider creating a baseline from pre-incident logs if available

- Template mining with Drain3 (via LogAnalysisTools_mine_templates):
  - Templates use <*> placeholders for dynamic parts (timestamps, IDs, numbers)
  - Templates with very low coverage (<0.01%) are often the most interesting for
    investigation — they represent rare events
  - Compare template lists between "before incident" and "during incident" time
    windows to identify what changed

=== Phase 3: Timeline Construction ===

- ALWAYS build a chronological timeline for incident investigations
- Use LogAnalysisTools_extract_timeline to extract significant events
- Cross-reference events across multiple log files from different components
- Look for causal chains: event A in component X → event B in component Y
- Pay special attention to the first error or anomalous event — it often
  indicates the trigger point, while later errors may be consequences

=== Phase 4: Code Correlation ===

- For every significant log finding, attempt to find the source code that produces it
- Use KnowledgeTools_find_relevant_files with error messages, log patterns, and
  component names as search terms
- Use KnowledgeTools_find_methods to locate methods referenced in stack traces
- Trace the execution path: find where the log statement is emitted, then trace
  backward to understand what conditions led to that code path being executed
- Check for recent code changes near the log-producing code — they may be the
  root cause

=== Phase 5: Baseline Creation (when requested) ===

- When asked to create a pattern baseline from known-good logs:
  1. Profile all provided log files to understand volume and characteristics
  2. Run LogAnalysisTools_mine_templates across all files
  3. Review the template list — ensure templates are meaningful and not over-split
  4. Create the baseline using LogAnalysisTools_create_or_compare_baseline in create mode
  5. Store the baseline under workspace/baselines/ so it persists
  6. The baseline document serves as the "normal behavior" reference for future
     investigations
  7. Recommend periodic baseline refresh (e.g., after major deployments)

=== Anti-Patterns to Avoid ===

- Do NOT attempt to grep through a 100 MB file using VisibleShellTools when
  LogAnalysisTools_search_logs provides the same capability with better output formatting
  and aggregation
- Do NOT read an entire large log file with ContainerFileTools_read_files — this will
  fail or produce unusable results
- Do NOT skip the profiling step — you need file size and severity distribution before
  choosing an analysis strategy
- Do NOT assume the first error you find is the root cause — build the full timeline
  and look for the earliest anomaly
- Do NOT ignore "missing pattern" anomalies when comparing against a baseline — the
  absence of an expected periodic event (e.g., health checks) can be as significant
  as the presence of new errors
- Do NOT fabricate log excerpts — only cite content you have actually retrieved from
  the log files using tools
- Do NOT propose code fixes without reading the actual source code — use KnowledgeTools
  to verify your understanding of the codebase

=== Output Quality Rules ===

- Every root cause hypothesis MUST include:
  1. A clear, one-sentence description
  2. At least one supporting log excerpt (with file, line number, and content)
  3. At least one code reference (with file path and relevant function/class)
  4. A confidence level (high, medium, or low) with reasoning
- If evidence is insufficient, mark the hypothesis as "low confidence" and specify
  what additional data would strengthen it
- The RCA report must be self-contained — a reader should not need to re-run the
  analysis to understand the findings
