# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. **This repo already has an established convention — follow it
exactly, don't use the generic `.scratch/` layout above for Wayfinder work.**

- **Map**: `.wayfinder/map.md` (Phase 1) or `.wayfinder/map-<name>.md` for a
  later/parallel effort (e.g. `map-frontend.md`, `map-phase2.md`).
- **Child ticket**: `.wayfinder/tickets/<PREFIX><NN>-<slug>.md` — prefix varies per
  map (`T` for map.md, `F` for map-frontend.md, `P` for map-phase2.md); pick a new
  prefix for a new map, numbered from `01` within that prefix. Header line
  `**Status:** open|closed`, `**Blocked by:** <links or "none">`,
  `**Blocks:** <links or "none">`, then `## Question` and `## Resolution`.
- **Research findings**: a resolved research ticket may link a fuller writeup at
  `.wayfinder/research/<slug>.md`.
- **Blocking**: a ticket is unblocked when every ticket it's `**Blocked by:**` is
  `closed`.
- **Frontier**: scan `.wayfinder/tickets/` for `**Status:** open` tickets belonging
  to the active map, unblocked and unassigned.
- **Claim**: no explicit assignee field in this repo's convention — claiming is
  implicit in starting work within a session.
- **Resolve**: write the answer under `## Resolution`, change `**Status:**` to
  `closed`, then append a context pointer (gist + link) to the map's
  `## Decisions so far`.

## Relationship to `/to-spec` and `/to-tickets`

Wayfinder tickets (`.wayfinder/`) are a decisions-and-rationale trail, not
execution tickets — they record *why* a choice was made, and stay around as
reference. A spec produced by `/to-spec` may link back to the Wayfinder ticket(s)
it draws on, but its own spec/tickets live under `.scratch/<feature-slug>/` per the
general convention above — the two directories are separate layers, not
alternatives for the same content.
