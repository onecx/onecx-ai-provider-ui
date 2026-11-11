When reviewing UI changes, pay particular attention to the project's Angular 19 conventions:

- Components should be standalone and use `ChangeDetectionStrategy.OnPush` and `inject()` for dependency injection.
- Prefer signals or `toSignal()` for observable-backed template state; clean up longer-lived subscriptions with `takeUntilDestroyed`.
- Use Angular's built-in `@if`, `@for`, and `@switch` template control flow.
- Use `PortalMessageService` for user-visible messages; the portal shell owns the toast outlet.

Check that changes preserve generated API-code boundaries and existing project behavior.
