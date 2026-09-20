# {{FILE_NAME}}

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

## Tech Stack

<!--
  resolve: agent-authored, not copied from this template.
  List only what's common/core to an Angular app (framework, language, styling). Do NOT
  carry over deep or project-specific choices (UI component library, charts, auth
  provider, backend, hosting, DB) from this template — detect those from the repo's
  package.json/lockfile and list what's actually there. If something can't be detected,
  leave it for the user to fill in manually rather than guessing.
-->

- Angular
- Styling: Tailwind CSS (if present)

## Architecture

- Feature modules are self-contained: components, models, services, and routing module
  live together under `modules/<feature>/`.
- Shared, cross-feature code (components, directives, guards, pipes, interceptors) lives
  under `shared/` — never import one feature module's internals from another feature.
- Business/validation logic belongs in services, not components. Components orchestrate
  UI and delegate to services.

## Project Structure

```
src/
    app/
        modules/
            core/
            <feature>/
                components/
                models/
                pages/
                services/
                <feature-routing>.module.ts
                <feature>.module.ts
        shared/
            components/                         # shared input components
            constants/                          # base constant, route constant
            directives/                         # shared directives
            guards/
            handlers/                           # custom handler
            helpers/                            # helper function
            interceptors/                       # app interceptor
            models/                             # shared model
            pipes/                              # global pipe
            services/                           # shared service
    index.html
    main.ts
angular.json
.editorconfig
```

### Rules

- Component filename MUST match exported name
- Test file (`*.spec.ts`) MUST be co-located in the same folder as the file it tests (e.g. `xxx.component.ts` + `xxx.component.spec.ts`, `xxx.service.ts` + `xxx.service.spec.ts`)

## Coding Convention

### Naming

| Pattern            | Use for                                                          |
| ------------------ | --------------------------------------------------------------------- |
| `PascalCase`       | Components, services, directives, pipes, types, interfaces              |
| `camelCase`        | Properties, methods, local variables                                    |
| `kebab-case`       | File names (e.g. `user-profile.component.ts`), component selectors      |
| `$` suffix         | Observable-returning properties/variables (e.g. `user$`)                |
| `UPPER_SNAKE_CASE` | Module-level constant                                                    |

### Coding Rules

- Keep components simple under 200 lines **unless the complexity genuinely justifies it
- Descriptive variable names — no abbreviations like `qty` for `quantity`
- No dead code without comment
- Comments only when intent is non-obvious
- Extract repeated logic into services
- Prefer extracting complex business logic into pure functions or services
- Keep Angular components focused on UI orchestration
- Avoid embedding complex condition logic directly inside templates or components
- **RxJS**: never leave a manual `.subscribe()` unmanaged — use `takeUntilDestroyed()` or the `async` pipe; the `async` pipe is preferred in templates over subscribing in the component class
- Avoid nested `.subscribe()` calls — compose with operators (`switchMap`, `combineLatest`, etc.) instead
- Use `ChangeDetectionStrategy.OnPush` for presentational components

### For Typescript

<!-- resolve: _shared/for-typescript.md (Plain) -->

### Editor Config

<!-- resolve: _shared/editor-config.md (Plain) -->

### Formatting Display

<!-- resolve: _shared/formatting-display.md (Plain) -->

### UI & Design System

- Tailwind utility classes only — no hand-written CSS rules, no inline `style`
- Design tokens are declared once (v4: `@theme {}`; v3: `theme.extend`) so Tailwind
  generates utilities for them, then consumed as utilities: `text-ink`, `hover:bg-ink`,
  `rounded-card`. Never reach for the raw variable — no `var(--color-ink)`, no
  `text-[var(--color-ink)]`. A token with no utility is a token in the wrong place
- Every interactive element needs `hover`, `focus`, `active`, `disabled` state
- Clickable element add class `cursor-pointer` and `cursor-not-allowed` when disabled
- Forms must be scannable and mobile-friendly
- Meet WCAG 2.1 AA for contrast and color blindness
- Support keyboard navigation
- CTA button: Solid primary only — no ghost buttons for main action

#### Rules

- **Imports**: do not deep-import from a library's internal paths — import only from its published public entry point. (Different concern from a heavy-barrel library like MUI in the React template: here we're avoiding fragile internals, not bundle size.)
- **Error handling**: for HTTP calls, extract a message in a shared `catchError` operator rather than a try/catch per call site:

  ```ts
  @Injectable({ providedIn: "root" })
  export class OrderService {
    constructor(private http: HttpClient) {}

    saveOrder(order: Order): Observable<Order> {
      return this.http.post<Order>("/api/orders", order).pipe(
        catchError((err: HttpErrorResponse) => {
          const message = err.error?.message ?? err.message ?? "Failed to save order";
          return throwError(() => new Error(message));
        })
      );
    }
  }
  ```

### Comment Code

<!-- resolve: _shared/comment-code.md (Plain) -->

### Before Creating New Code

<!-- resolve: _shared/before-creating-new-code.md (Plain, {{ARTIFACTS}}="component, service, directive, or model") -->

### Loading Indicator

<!-- resolve: _shared/loading-indicator.md (Plain) -->

### Commands

```bash
npm start           # start dev server
npm run test        # run test
npm run build       # build uat

# angular cli
ng g c <component_name>     # generate component
ng g s <service_name>       # generate service
```

## Testing & Quality

Before marking task complete:

1. Run `npm run test` — fix all failing tests
2. Run `npm run build` — fix all Typescript + build errors
3. Fix all Angular template compilation errors

### Test Runner

- Use Jest for all unit tests
- Use Angular TestBed for component and service tests

### Unit Test Rules

Unit test required for:

- Calculation and business logic
- Form validation logic
- Formatting utilities (date, number, unit, currency)
- Permission and authorization rules
- Reusable pure functions

Do not write unit tests for:

- Angular framework behavior
- Third-party libraries
- HTML/CSS rendering unless it contains business-critical behavior

### Rules

<!-- resolve: _shared/testing-no-edit-rule.md (Plain) -->

## Security Rules

<!-- resolve: _shared/security-rules.md (Plain) -->

## Definition of Done

<!-- resolve: _shared/definition-of-done.md (Plain) -->
