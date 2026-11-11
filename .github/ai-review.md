# Consumer-specific focus

The standard workflow provides the general change-impact evaluation. This optional guidance adds focus for this Angular consumer without replacing that evaluation or the defect-review rules.

Pay particular attention to exported component inputs/outputs, generated API-model compatibility, permission and tenant context, and asynchronous lifecycle changes. Explain their effects on callers and user flows, and what a human reviewer should verify when the consequences are uncertain.

## Angular focus

Pay particular attention to the project's Angular 19 conventions:

- Components should be standalone and use `ChangeDetectionStrategy.OnPush` and `inject()` for dependency injection.
- Prefer signals or `toSignal()` for observable-backed template state; clean up longer-lived subscriptions with `takeUntilDestroyed`.
- Use Angular's built-in `@if`, `@for`, and `@switch` template control flow.
- Use `PortalMessageService` for user-visible messages; the portal shell owns the toast outlet.

Check that changes preserve generated API-code boundaries and existing project behavior.
