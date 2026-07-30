## Before changing code

- Read `package.json` and `angular.json` before any change.
- Follow the existing coding style precisely.
- Remove unused imports. Before removing a module import, verify it is not used in the template.
- After changing a component, check the template, the spec file, and every usage of the component's public API.
- Explain all breaking changes before modifying code.
- Use English for all comments and documentation.

### Import section order
```
Angular (@angular/core, @angular/common, @angular/forms, …)
RxJS interop (@angular/core/rxjs-interop)
RxJS (rxjs, rxjs/operators)
Third-party (primeng/*, ngx-translate/*, file-saver, …)
OneCX (@onecx/*)
Local (src/app/*)
```

---

## Angular 19 patterns (mandatory)

### Components
- All components are **standalone** (`standalone: true` in `@Component`).
- Always use **`ChangeDetectionStrategy.OnPush`**.
- Use **`inject()`** for dependency injection — never inject via constructor parameters.
```typescript
// ✅ correct
public readonly count = signal(0)
public readonly doubled = computed(() => this.count() * 2)

constructor() {
  effect(() => {
    if (this.visible()) this.resetState()  // side effect
  })
}

// ❌ wrong — side effects in computed
public readonly headers = computed(() => {
  this.resetState()  // throws NG0600 at runtime
  return new HttpHeaders()
})
```

### Observables & subscriptions
- Prefer `toSignal()` over the `async` pipe for observable-to-template binding.
- Use `takeUntilDestroyed(this.destroyRef)` for subscriptions that must be cleaned up.
- Do **not** use `@UntilDestroy()` from `@ngneat/until-destroy` — use the Angular-native approach.
- For cancellable HTTP calls use a `Subject` + `switchMap` pipeline (not a manual `Subscription` variable).
- Single-emission HTTP calls (HTTP verbs that complete after one value) may use `.subscribe()` without explicit cleanup.
- `EventEmitter` is only valid as an `@Output()` or where required by an external API contract (e.g. `ocx-slot [outputs]`). Use `Subject` for all other internal event streams.

### Templates
- Use **`@if`**, **`@for`**, **`@switch`** — never `*ngIf`, `*ngFor`, `*ngSwitch`.
- Extract conditions with more than one operand into named `computed()` signals.
- Bind signal values directly: `[prop]="mySignal()"`. Use `async` pipe only for observables not converted to signals.

### Notifications (OneCX)
- Use **`PortalMessageService`** from `@onecx/angular-integration-interface` for all user-visible messages.
- Do **not** import `ToastModule` or place `<p-toast>` in component templates — the portal shell owns the global toast outlet.

---