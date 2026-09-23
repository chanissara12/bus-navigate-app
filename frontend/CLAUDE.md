# CLAUDE.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

**Backend App:** see [../backend/CLAUDE.md](../backend/CLAUDE.md)

## Tech Stack

This is a brand-new project — nothing is scaffolded yet. The list below is the planned
baseline; update it once real dependencies land in `package.json`.

- Angular
- Styling: Tailwind CSS
- Routing/HTTP: Angular Router + `HttpClient` (no extra state management library planned)

## Architecture

- Feature modules are self-contained: components, models, services, and routing module
  live together under `modules/<feature>/`.
- Shared, cross-feature code (components, directives, guards, pipes, interceptors) lives
  under `shared/` — never import one feature module's internals from another feature.
- Business/validation logic belongs in services, not components. Components orchestrate
  UI and delegate to services.

## Project Structure

This is a proposed layout for the new project, not a survey of existing code.

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

- Strict mode on, avoid `any` — prefer `unknown` + narrowing when the real type isn't known yet
- Named exports only — plays better with refactors and auto-import than default exports
- Prefer `undefined` for "no value yet" (optional props, uninitialized state — it's TS/JS's native absence); use `null` only when a value is intentionally, explicitly empty (e.g. mirrors a nullable API/DB field) — don't use the two interchangeably
- `async/await` over `.then` chains
- Avoid the non-null assertion (`!`) — narrow the type instead; `!` compiles clean but is a top cause of "compiles fine, crashes at runtime" bugs

### Editor Config

This repo enforces formatting via `.editorconfig` at the repo root. An AI agent has no
built-in mechanism to auto-load editor config files the way an IDE does — the concrete
rule is restated here so it's actually in context. Match it in every file you write or
edit; don't infer indentation by eyeballing surrounding code.

- Indent: 4 spaces (repo-wide default)
- Line endings: LF, UTF-8, final newline required
- Trailing whitespace trimmed (except Markdown, where it's meaningful for line breaks)
- Line endings are enforced by `.gitattributes` at the repo root, not by your local Git
  settings — never "fix" them by hand, and never change `core.autocrlf` to work around a
  complaint from a formatter
- `.vscode/settings.json` is committed and pins the same rules for the editor. It is not
  personal configuration — do not add themes, fonts, or machine-specific paths to it, and
  do not relax its formatting keys to match a file that is already wrong

If a formatter reports a line-ending or whitespace failure across files you did not
touch, that is a repository configuration problem, not a code problem. Report it and
leave it alone. Do not answer it with a repo-wide reformat, and never let unrelated
reformatted files ride along in a change.

### Formatting Display

- Date: `YYYY-MM-DD`
- DateTime: `YYYY-MM-DD HH:mm:ss`
- Time only: `HH:mm` / `HH:mm:ss`
- Money / amounts: 2 decimal places
- Yield / percentage return: 6 decimal places

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

- `// Note:` — allowed for context that aids understanding
- `// TODO:` — if encountered **in files you are editing**, flag it to the user before proceeding

### Before Creating New Code

Before creating a new component, service, directive, or model — search whether an
equivalent implementation already exists and reuse it whenever possible. Before
introducing any new type, ask the user to confirm its name unless the name is explicitly
specified in the requirement.

### Loading Indicator

Classify by what's on screen, not by how long a call might take — an agent can always
tell from the markup/template whether something is static, fetched, or a triggered
action; it can never know a call's real-world latency ahead of time.

| UI pattern                                                                                                    | Treatment                                                       |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Static text / content that never depends on a fetch                                                                 | No indicator                                                           |
| View is populated by fetched data — lists, detail pages, dropdown options, any `[label]: [input]` field backed by an API call | Skeleton UI                                                            |
| User-triggered action — submit, save, delete, any button that mutates data                                           | Spinner — disable the control and show the spinner inline/on the button |

#### Rules

- A dropdown/select whose options come from an API counts as fetched data even though it's a small control — skeleton it, don't treat it as static just because it's compact
- Use a full-screen/backdrop spinner only when the action blocks the entire view (e.g. a multi-step wizard submit) — otherwise keep the spinner scoped to the triggering control
- If a similar case already has a loading treatment elsewhere in the repo, match it — consistency beats re-deriving the pattern from scratch

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

- **DO NOT edit a test to make a failure pass.** When a test breaks after a code change, stop and report which tests failed and why — decide whether the _code_ regressed or the expected behavior genuinely changed, summarize the impact, and wait for explicit approval before touching any test. Do not assume the test is wrong just because it is red.

Root-wide rules (security, Definition of Done) live in
[../CLAUDE.md](../CLAUDE.md) — this file only covers what's specific to the frontend.
