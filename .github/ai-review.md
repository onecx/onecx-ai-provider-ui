# Review focus

Provide an independent change-impact evaluation alongside actionable findings, including when there are no findings. Use the workflow's supported evaluation fields for the template below, preserving its required output contract. Assess only the reviewed range and state coverage limits.

## Overall evaluation template

- **Summary:** what changed and the evidence supporting your assessment.
- **Overall impact:** `fine` or `dangerous`, with a reason. `fine` is a scoped AI estimate, not approval or a safety guarantee; zero findings alone does not establish it.
- **Human review:** recommended or not, with the specific change, expertise and decision a human should check.
- **Door:** `one-way` for destructive or hard-to-reverse changes; `two-way` for changes with an evidenced, inexpensive rollback; `uncertain` when reversibility is unverified.
- **Blast radius:** affected paths, callers, consumers and propagation of a failure. Identify uncertainty rather than guessing.

Evaluate every area below. For each, provide the changed behavior and affected paths as evidence, potential consequence severity, an impact estimate (`fine` / `dangerous`), and whether human review is recommended with a reason:

| Area       | Changes to examine                                                                      |
| ---------- | --------------------------------------------------------------------------------------- |
| Interfaces | Public exports, component inputs/outputs, endpoints, payloads, events and consumer compatibility. |
| Security   | Authorization, tenant isolation, sensitive data, credential handling and input validation. |
| Data model | API/persisted models, schema migrations, defaults, compatibility and potential data loss. |
| Structure  | Module boundaries, dependencies, configuration and deployment/runtime structure.         |
| Core logic | Business rules, state transitions, asynchronous behavior, lifecycle and error handling.  |

Use severity `none`, `low`, `medium`, `high`, `critical` or `unknown` for potential change consequences, separately from finding severity. Mark unchanged areas explicitly; use `unknown` for unassessed areas. Cite before/after behavior and available test evidence without claiming tests ran when only their source was inspected.

Recommend human review for dangerous impact, one-way doors, broad or uncertain blast radius, or unverified interface/security/data-model consequences. Explain what to verify and why; uncertainty is a reason for caution, not an invented defect. The overall verdict must not hide a dangerous area or a per-area human-review recommendation. A human-review recommendation is independent of defect findings and does not approve or reject the PR.

## Angular focus

Pay particular attention to the project's Angular 19 conventions:

- Components should be standalone and use `ChangeDetectionStrategy.OnPush` and `inject()` for dependency injection.
- Prefer signals or `toSignal()` for observable-backed template state; clean up longer-lived subscriptions with `takeUntilDestroyed`.
- Use Angular's built-in `@if`, `@for`, and `@switch` template control flow.
- Use `PortalMessageService` for user-visible messages; the portal shell owns the toast outlet.

Check that changes preserve generated API-code boundaries and existing project behavior.
