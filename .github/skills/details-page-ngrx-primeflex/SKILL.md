# Details Page Skill (NgRx + PrimeFlex + OneCX)

## Purpose
Use this skill when creating or extending a details page in this project (example domain: Agent Details), with strict focus on:
- predictable NgRx state flow
- PrimeNG/PrimeFlex-first UI patterns
- explicit edit/view mode behavior
- translation correctness
- reliable unit tests

## Scope
Applies to details feature files similar to:
- state: `*.state.ts`
- actions: `*.actions.ts`
- reducer: `*.reducers.ts`
- selectors/viewmodel: `*.selectors.ts`, `*.viewmodel.ts`
- effects: `*.effects.ts`
- component/template/style: `*.component.ts|html|scss`
- tests: `*.component.spec.ts`, `*.effects.spec.ts`, `*.selectors.spec.ts`

## Architecture Rules

### 1) Keep data flow unidirectional
- UI events dispatch actions only.
- Effects handle async I/O, dialogs, toasts, and navigation side effects.
- Reducers stay pure (no service calls, no side effects).
- Component derives UI from `viewModel$` selectors.

### 2) Use a typed ViewModel selector
- Build one composed selector (e.g. `selectXxxDetailsViewModel`) that contains all fields used by template.
- Do not pull many individual selectors directly in template.

### 3) Normalize feature state for details pages
Required baseline flags:
- `details`
- `detailsLoadingIndicator`
- `detailsLoaded`
- `editMode`
- `isSubmitting`

If page loads option datasets (providers/models/groups/tools etc.), add per-dataset:
- list field (e.g. `groups`)
- loading flag (e.g. `groupsLoadingIndicator`)

### 4) Action naming convention
Use event-style action names, for example:
- `Navigated to details page`
- `X details received`
- `X details loading failed`
- `Edit button clicked`
- `Save button clicked`
- `Update X succeeded/failed`
- `Delete button clicked`
- `Delete X succeeded/failed`

### 5) Save/update payload discipline
- Build API payload explicitly from persisted model fields only.
- Never leak UI-only fields into save payload (`newGroupName`, temporary form helpers, transient arrays not supported by backend).
- Include concurrency fields when required by API (e.g. `modificationCount`).

## Component + Template Rules

### 1) Form setup and edit mode
- Initialize form controls in constructor.
- Disable form by default.
- On `viewModel$` updates:
  - patch form values when not editing
  - `markAsPristine()` after patch
  - enable/disable form strictly from `editMode`
- Save/Cancel/Delete buttons must be conditioned by `editMode` and `isSubmitting`.

### 2) Header actions
- Header actions are derived from `viewModel$` and dispatch actions.
- Use permission keys for guarded actions (edit/delete).
- Do not mutate local state inside action callbacks except dispatching.

### 3) PrimeNG component usage
- Prefer PrimeNG form controls (`p-inputText`, `p-select`, `p-multiSelect`, `p-autoComplete`, etc.) with `p-floatlabel`.
- Ensure each control has stable `id` and matching `<label for="...">`.
- For icon-only buttons, provide accessible text (`aria-label`) and non-empty content where lints require it.

### 4) PrimeFlex-first styling
- Prefer utility classes in template over custom SCSS:
  - layout: `flex`, `flex-column`, `md:flex-row`, `gap-*`
  - sizing: `w-full`, `md:w-auto`, `md:flex-1`, `flex-shrink-0`
  - spacing/typography: `mt-*`, `mb-*`, `text-lg`, `font-semibold`
- Add custom SCSS only when utilities cannot solve it.
- Avoid `::ng-deep` unless there is no safe alternative.

### 5) Translation keys
- All visible strings must be translated (EN + DE at minimum).
- Keep wording aligned with product terminology (e.g. "Tools (MCP)").
- When test failures happen after wording changes, update test expectations to match translations.

## Effects Rules

### 1) Navigation-driven loading
- Trigger details load from router navigation effect.
- Resolve id via route selector.
- Handle missing id with explicit failure action.

### 2) Dialog flows
- Cancel dirty form: open confirm dialog and branch to confirm/back actions.
- Delete: open confirm dialog, abort on secondary action.

### 3) Messages and errors
- Success and error toasts should be emitted from effects.
- Keep a central map for error action -> translation key when possible.

### 4) Back navigation
- Check back-navigation capability selector before `history.back()`.
- Dispatch explicit success/failure actions for navigation attempts.

## Testing Checklist (Required)

### Component spec
- Creates successfully.
- Renders translated header/subheader.
- Breadcrumbs are set.
- Header actions dispatch correct actions.
- Edit mode toggles and button visibility/disabled behavior are correct.
- Save dispatch payload matches API model only.
- Use proper module imports for Prime controls in template tests.
- Do not rely on `CUSTOM_ELEMENTS_SCHEMA` to hide missing imports in feature tests.

### Effects spec
- Route navigation triggers details fetch.
- Missing id path is covered.
- Load success and load error are covered.
- Save success/cancel/failure paths are covered.
- Delete confirm/cancel/failure paths are covered.
- Message service calls verified for success/error cases.

### Selectors spec
- ViewModel projector includes all declared state fields.
- New state fields must be added to projector test immediately.

### Test execution
Run targeted tests during development:
- details component/effects/selectors/reducers specs
Then run broader feature tests before completion.

## Lint and Quality Guardrails
- Fix template lint issues directly (for example: non-empty button content).
- Prefer semantic fixes over suppressions.
- Use `NOSONAR` only when issue is known false positive and cannot be reasonably refactored.

## Implementation Workflow (Step-by-step)
1. Extend state + viewmodel types.
2. Add actions for load/edit/save/cancel/delete (+ option datasets if needed).
3. Update reducer transitions for loading/edit/submitting states.
4. Implement effects for API, dialogs, messages, navigation.
5. Update selectors and composed viewmodel.
6. Implement component logic (form patching, edit mode, payload mapping).
7. Build template with PrimeNG controls + PrimeFlex utilities.
8. Add translation keys for all new UI text.
9. Update component/effects/selectors specs.
10. Run targeted tests and lint; fix regressions.

## Done Definition
A details page change is complete only if:
- state/actions/reducer/selectors/effects/component/template are consistent
- edit mode works end-to-end (view, edit, save, cancel)
- payloads are API-correct
- translations exist and match tests
- lint passes
- targeted tests pass
