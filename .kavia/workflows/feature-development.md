---
name: feature-development
description: Guide feature implementation from planning through verification and documentation.
---

# Feature Development

Use this workflow when the user asks Kavia to implement a feature that is likely to require coordinated planning, implementation, testing, and documentation.

If the feature is sufficiently complex, we should first create a detailed feature definition using the DocumentationAgent. Ask the user to review and approve the feature definition document. User may ask for further edits to this document.

If may need to create a ladder architectural proposal for the feature. After user's approval ask the user if this requires a detailed design document. If the user says so, initiate creation of that with the Documentation agent.

Once the specifications are finalized, ask whether the user wants a detailed implementation plan or to proceed directly to coding. Create or refine an implementation plan through DocumentationAgent using the Implementation Plan skill. Keep the plan document synchronized through refinement, approval, execution handoff, amendments, and any required reapproval.

If a plan is produced, obtain its documented approval before implementation. Keep overlay materialization approval distinct from plan execution authorization.

Use CodeWritingAgent for implementation. Use TestCodeWritingAgent when tests need to be added and TestExecutionAgent when the resulting changes need to be executed and verified. If verification identifies a defect, use BugFixingAndVerificationAgent and then repeat the relevant verification. Update affected documentation after the implementation is stable.

Adapt these instructions to the user's explicit request, the available micro-agents, and the results of each completed step. Do not bypass normal approval, interruption, or failure-handling rules.
