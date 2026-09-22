# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository

## Tech Stack

- React 19 + TypeScript, built with Vite
- No CSS framework — plain CSS with custom properties (`app/src/index.css`), light/dark via `prefers-color-scheme`
- No client-side router, no server-state library (React Query, SWR) — data is a single static JSON blob fetched once (see Architecture)
- Lint: oxlint. Test runner: Vitest + Testing Library (jsdom)

## Architecture

This is a single-page, offline-first PWA-style app for reading Bangkok bus routes at a stop. The real product code lives under [app/](app/); the repo root only holds docs, tickets, and raw data caches — see Project Structure.

- All domain data (stops, routes, directions, map background) is generated ahead of time by scripts in `app/scripts/` from GTFS + OSM extracts, and shipped as static JSON under `app/public/data/`. The app fetches this once at startup (`lib/loadBusData.ts` → `lib/useBusData.ts`) and holds it in memory — there is no live API and no per-screen data fetching.
- The on-disk/wire data format is columnar (struct-of-arrays, delta-encoded coordinates, quantized offsets) to keep the JSON small — see the comment in [app/src/lib/types.ts](app/src/lib/types.ts). Don't reshape it back to array-of-objects without a reason; that tradeoff was deliberate (WF-009).
- `components/` are screens/UI (`StopScreen`, `DestinationScreen`, `MisboardScreen`, `RouteDetailScreen`, map overlays); `lib/` is everything else — data loading, geo math, route/destination lookup, search, the offline SVG map renderer. Keep business/lookup logic in `lib/`, not inside components.
- Domain terminology (สาย/ทิศ/ป้าย/headsign/misboarding/etc.) is defined in [CONTEXT.md](CONTEXT.md) — read it before naming new types or variables so the code matches the vocabulary the user actually uses, not an invented one.
- Data provenance and licensing (GTFS feed, OSM extract) is documented in [ATTRIBUTION.md](ATTRIBUTION.md) — any change to what's derived from OSM must stay consistent with it.

## Project Structure

```
AGENTS.md / CLAUDE.md
CONTEXT.md                  # domain language — read before naming things
ATTRIBUTION.md              # data licensing/provenance
.wayfinder/                 # local ticket tracker (no issue tracker connected)
  MAP.md
  tickets/WF-NNN-slug.md
  research/
scratch/                    # local-only raw GTFS/OSM extracts, gitignored, not build output
prototypes/                 # throwaway prototypes (wayfinder "prototype" tickets), not shipped code
app/                        # the actual product
  src/
    components/             # screens and UI (StopScreen, DestinationScreen, MisboardScreen, ...)
    lib/                    # data loading, geo math, lookup/search logic, SVG map renderer
    App.tsx
    main.tsx
    index.css
  scripts/                  # build-time data pipeline: GTFS/OSM -> app/public/data/*.json
  public/data/               # generated static data consumed at runtime (not hand-edited)
```

### Rules

- Never put lookup/search/geo logic inside a component — put it in `lib/` as a pure, testable function and have the component call it
- Files that generate `app/public/data/*.json` live in `app/scripts/`; that JSON is a build artifact — don't hand-edit it, regenerate it
- New screens go under `components/`; new non-UI logic goes under `lib/` next to its test file

## Coding Convention

### Naming

| Pattern | Use for |
| --- | --- |
| `PascalCase` | Components — file name matches the exported component (e.g. `StopScreen.tsx`) |
| `camelCase` | Functions, variables, non-component files under `lib/` (e.g. `loadBusData.ts`) |
| `use` + `camelCase` | Custom hooks (e.g. `useBusData`, `useGeolocation`) — file name matches |
| `UPPER_SNAKE_CASE` | Module-level constants (e.g. `ORIGIN_WALK_RADIUS_M`) |

### Coding Rules

- Descriptive variable names — no abbreviations
- No dead code without comment
- Comments only when intent is non-obvious (see Comment Code below) — this repo already leans on comments to record *why* a non-obvious tradeoff was made (e.g. the columnar data format), not *what* the code does
- Extract repeated logic into `lib/` functions, not component-local helpers
- Handle errors at the call site (see `useBusData`'s `.catch`)

### For Typescript

- Strict mode on, avoid `any` — prefer `unknown` + narrowing when the real type isn't known yet
- Named exports only — plays better with refactors and auto-import than default exports
- Prefer `undefined` for "no value yet" (optional props, uninitialized state — it's TS/JS's native absence); use `null` only when a value is intentionally, explicitly empty (e.g. mirrors a nullable feed field) — don't use the two interchangeably
- `async/await` over `.then` chains
- Avoid the non-null assertion (`!`) — narrow the type instead; `!` compiles clean but is a top cause of "compiles fine, crashes at runtime" bugs

### Editor Config

This repo enforces formatting via `.editorconfig` at the repo root. An AI agent has no built-in mechanism to auto-load editor config files the way an IDE does — the concrete rule is restated here so it's actually in context. Match it in every file you write or edit; don't infer indentation by eyeballing surrounding code.

- Indent: 2 spaces (repo-wide, matches the existing codebase)
- No semicolons, single quotes — matches existing `.ts`/`.tsx` style; oxlint does not currently enforce this, follow the surrounding file
- Line endings: LF, UTF-8, final newline required
- Trailing whitespace trimmed (except Markdown, where it's meaningful for line breaks)
- Line endings are enforced by `.gitattributes` at the repo root, not by your local Git settings — never "fix" them by hand, and never change `core.autocrlf` to work around a complaint from a formatter
- `.vscode/settings.json` is committed and pins the same rules for the editor. It is not personal configuration — do not add themes, fonts, or machine-specific paths to it, and do not relax its formatting keys to match a file that is already wrong

If a formatter reports a line-ending or whitespace failure across files you did not touch, that is a repository configuration problem, not a code problem. Report it and leave it alone. Do not answer it with a repo-wide reformat, and never let unrelated reformatted files ride along in a change.

### Formatting Display

- Date: `YYYY-MM-DD`
- DateTime: `YYYY-MM-DD HH:mm:ss`
- Time only: `HH:mm` / `HH:mm:ss`
- Distance: meters, no decimal places in UI text (e.g. `120 m`)

### UI & Design System

- Plain CSS with custom properties declared once in `:root` (`app/src/index.css`), overridden under `@media (prefers-color-scheme: dark)` — never hardcode a color, reference the variable (`var(--text)`, `var(--accent)`, ...)
- No CSS framework — don't introduce Tailwind/MUI/etc. without an explicit decision from the user
- Thai-first UI copy — screens are labeled in Thai (e.g. "ที่ป้าย", "ไปไหน"); match the existing tone and terminology from [CONTEXT.md](CONTEXT.md) rather than translating literally
- Every interactive element needs visible state for active/selected (see `.active` class usage on tab buttons)
- Support keyboard navigation; this is a mobile-first, at-the-bus-stop tool — layouts must work one-handed on a phone screen

### Comment Code

- `// Note:` — allowed for context that aids understanding
- `// TODO:` — if encountered **in files you are editing**, flag it to the user before proceeding

### Before Creating New Code

Before creating a new component, hook, util, or type — search whether an equivalent implementation already exists and reuse it whenever possible. Before introducing any new type, ask the user to confirm its name unless the name is explicitly specified in the requirement.

### Commands

```bash
npm run dev              # Start dev server (Vite), from app/
npm run build             # TypeScript project build + Vite build
npm run lint               # oxlint check
npm run test                # Vitest, run once
npm run test:watch          # Vitest, watch mode
npm run build:data           # Regenerate app/public/data/bus-data.json from scratch/gtfs
npm run build:map-background  # Regenerate the offline SVG map background from scratch/osm
```

## Testing & Quality

Before marking task complete:

1. Run `npm run lint` (from `app/`) — fix all oxlint errors
2. Run `npm run test` (from `app/`) — fix all failing tests
3. Run `npm run build` (from `app/`) — fix all TypeScript + build errors

### Test Runner

- Test runner is Vitest with `@testing-library/react` (jsdom environment, globals on — see `app/vite.config.ts`)
- Tests are co-located next to the code under test (`*.test.ts` for pure logic, `*.test.tsx` for components)
- A `.realdata.test.ts` suffix (e.g. `destinationLookup.realdata.test.ts`) marks a test that exercises real generated data rather than fixtures — keep that distinction when adding similar tests

### Unit Test Rules

Unit test required for:

- Lookup/ranking/geo logic in `lib/` (route lookup, destination lookup, misboard recovery, spatial index, geo math, number/text matching)
- Data transforms (`packedCodec`, `simplify`, CSV/build scripts)

Do not write unit tests for:

- Presentational components with no logic
- The generated JSON data itself

To test logic embedded in a component, extract it into a pure function under `lib/`.

### Rules

- **DO NOT edit a test to make a failure pass.** When a test breaks after a code change, stop and report which tests failed and why — decide whether the *code* regressed or the expected behavior genuinely changed, summarize the impact, and wait for explicit approval before touching any test. Do not assume the test is wrong just because it is red.

## Security Rules

- DO NOT hardcode API keys, tokens, passwords, or credentials in source code
- DO NOT log sensitive data (passwords, tokens, secrets, connection strings)
- DO NOT commit `.env`, `.env.local`, or any file containing secrets or credentials
- Never commit raw GTFS/OSM extracts (`scratch/`) or generated bundles that don't belong in git — see `.gitignore`

## Definition of Done

A task is complete only when

- Build succeeds
- Tests pass
- Formatting and any configured analyzers pass, verified in CI and not only locally
- Existing behavior is preserved
- Requested functionality is implemented
- No unnecessary files are added
- No unrelated code is modified
