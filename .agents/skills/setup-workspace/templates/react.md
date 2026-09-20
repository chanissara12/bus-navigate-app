# {{FILE_NAME}}

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

## Tech Stack

<!--
  resolve: agent-authored, not copied from this template.
  List only what's common/core to a React app (framework, language, styling). Do NOT
  carry over deep or project-specific choices (UI kit, charts, auth provider, backend,
  hosting, DB) from this template — detect those from the repo's package.json/lockfile
  and list what's actually there. If something can't be detected, leave it for the user
  to fill in manually rather than guessing.
-->

- React (+ TypeScript, if used)
- Styling: Tailwind CSS (if present)

## Architecture

<!--
  resolve: agent-authored, not copied from this template.
  Describe how the pieces of THIS repo fit together (frontend/backend split, where
  business logic lives, how data flows) — derive it from the actual repo, not from any
  other project. If a longer architecture doc already exists in the repo (e.g.
  ARCHITECTURE.md), link to it here instead of duplicating it.
-->

- Server state (API data) lives in React Query; never duplicate server data into client-side state
- Keep components and business/data logic separate — see Project Structure rules below

## Project Structure

```
.editorconfig
src/
    core/
        layouts/            # app layout -> public, private
        pages/               # system page authorized, not-found, unauthorized
        providers/           # incl. QueryClientProvider (React Query)
        query/               # React Query: queryClient config, default options, shared query keys
        router/               # route setup, Protected Route
        http/                 # http client
    modules/                  # feature
        <module_name>/
            components/       # module component
            constants/        # module constant
            hooks/            # React Query hooks (useQuery/useMutation) wrapping services
            services/         # API calls (http client) — no React Query here
            store/            # Zustand store: module-scoped client/UI state
            utils/            # pure function for test
            types/
    shared/                   # reuseable
        components/           # reusable component -> dropdown, text-box, number-box, check-box
        constants/            # constant
        routes/               # route path constants
        store/                # global Zustand stores (cross-module client/UI state)
        context/              # shared state via React Context (light, non-global)
        hooks/
        utils/                # pure function for test
        types/                # type, class, interface
    assets/
    .env.example              # environment template only. **use a fake credential or secret
    App.tsx
    main.tsx
```

### Rules

- Never put side effects inside presentational components
- New modules added under `modules`
- Do not create a new abstraction for one-off usage
- Component filename MUST match its exported name
- **React Query**: `services/` = raw API calls; `hooks/` = `useQuery`/`useMutation`
  wrapping those services. `QueryClient` config in `core/query/`, provider in `core/providers/`
- **Zustand**: module-scoped store → `modules/<module>/store/`; cross-module global
  store → `shared/store/`. Never duplicate server data into a store (server data lives in React Query)

## Coding Convention

### Naming

| Pattern              | Use for                                                      |
| -------------------- | --------------------------------------------------------------- |
| `PascalCase`         | Components, types, interfaces — file name matches for component files |
| `camelCase`          | Functions, variables                                            |
| `use` + `camelCase`  | Custom hooks (e.g. `useAuth`) — file name matches                |
| `kebab-case`         | Non-component file names (e.g. `date-utils.ts`)                 |
| `UPPER_SNAKE_CASE`   | Module-level constant                                            |

### Coding Rules

- Keep components simple under 200 lines **unless the complexity genuinely justifies it
- Descriptive variable names — no abbreviations like `qty` for `quantity`
- No dead code without comment
- Comments only when intent is non-obvious
- Extract repeated logic into hooks
- Handle errors at the call site
- **State split**: server data → React Query (never copy server data into Zustand);
  Zustand only for client/UI state (filters, modals, wizard steps, session prefs)
- **Money precision**: never use `float`/`number` math for money, quantity, rate, or
  FX — carry it as string/decimal from the API and format at the display edge only

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
- **Transitions**: use the most specific transition class. Avoid `transition-all`. If only color is animating, omit the transition entirely — do not use `transition-colors`

#### Rules

- **Imports**: for a library with a heavy barrel export (e.g. MUI), import from the specific file, not the package root — keeps bundles tree-shakeable:
  ```ts
  // ✓
  import Button from "@mui/material/Button";
  // ✗
  import { Button } from "@mui/material";
  ```
- **Error handling**: in `catch` blocks, extract a message in priority order — API error body, then `Error.message`, then a fixed fallback string. Use `axios.isAxiosError()` to narrow, not a manual cast:

  ```ts
  function getErrorMessage(err: unknown, fallback = "An error occurred"): string {
    if (axios.isAxiosError(err)) {
      return err.response?.data?.message ?? err.message ?? fallback;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return fallback;
  }

  try {
    await saveOrder(order);
  } catch (err) {
    const message = getErrorMessage(err, "Failed to save order");
    toast.error(message);
  }
  ```

### Comment Code

<!-- resolve: _shared/comment-code.md (Plain) -->

### Before Creating New Code

<!-- resolve: _shared/before-creating-new-code.md (Plain, {{ARTIFACTS}}="component, hook, util, or type") -->

### Loading Indicator

<!-- resolve: _shared/loading-indicator.md (Plain) -->

### Commands

```bash
npm run dev          # Start dev server (Vite)
npm run dev:host     # Dev server accessible from network
npm run build        # TypeScript check + Vite build
npm run build:uat    # Build for UAT environment
npm run build:prod   # Build for production
npm run lint         # ESLint check
npm run preview      # Preview production build
npm run test         # Test with Vitest
```

## Testing & Quality

Before marking task complete:

1. Run `npm run lint` — fix all ESLint errors
2. Run `npm run test` — fix all failing tests
3. Run `npm run build` — fix all Typescript + build errors

### Test Runner

- Test runner is Vitest. `npm run test` runs once; `npm run test:watch` watches.
- Tests are pure-logic only (`*.test.ts`, node env, no DOM) — co-located next to the code under test.

### Unit Test Rules

Unit test required for:

- Calculation logic
- Form validation
- Unit / currency formatting

Do not write unit tests for:

- Presentational components with no logic
- Third-party library behavior

To test logic embedded in a component, extract it into a pure function (e.g. `/utils/`).

### Rules

<!-- resolve: _shared/testing-no-edit-rule.md (Plain) -->

## Security Rules

<!-- resolve: _shared/security-rules.md (Plain) -->

## Definition of Done

<!-- resolve: _shared/definition-of-done.md (Plain) -->
