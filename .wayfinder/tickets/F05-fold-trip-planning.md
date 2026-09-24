# [wayfinder:task] Fold trip-planning into production

**Parent map:** [Frontend Build-out — Real Backend Integration](../map-frontend.md)

**Status:** closed
**Blocked by:** [Shared frontend infrastructure](F02-shared-frontend-infrastructure.md),
[App shell & navigation](F03-app-shell-navigation.md),
[Loading & error UI patterns](F04-loading-error-ui-patterns.md)
**Blocks:** none

## Question

Fold [T12](T12-trip-planning-ui-layout.md)'s winning Variant A (list-first) into
`trip-planning-home.component`; drop Variants B/C and the `?variant=` switcher from
this module. Wire it to the real backend instead of
`prototype/prototype-mock-data.ts`:

- Destination search → `GET /places/search?q={text}` (per
  [T11](T11-initial-trip-planning-search.md)).
- Results → `POST /travel-options`.
- Each result card gets an inline "เริ่มเดินทาง" (start trip) button (per the map's
  Notes) that opens `ConfirmDialogComponent` ([F02](F02-shared-frontend-infrastructure.md)),
  then on confirm fires `POST /travel-sessions` and navigates to
  `/travel-session/:id` using the routing shape from
  [F03](F03-app-shell-navigation.md).
- Apply the loading-skeleton/error-banner patterns from
  [F04](F04-loading-error-ui-patterns.md).

## Resolution

`trip-planning-home.component` is now the real page — Variant A's layout is inlined
directly into it, wired to the real backend:

- New models mirroring the real contracts exactly (numeric enums, since
  `System.Text.Json` serializes them as numbers, not strings — same convention as
  `travel-session-state.model.ts`): `modules/trip-planning/models/place.model.ts`
  (`PlaceKind`, `PlaceSearchResult`), `.../travel-option.model.ts` (`TravelOption`,
  `EvaluationReason`, `ReasonCode`), plus two new shared models other fold tickets will
  also need: `shared/models/data-confidence.model.ts` (`DataConfidence`) and
  `shared/models/travel-session.model.ts` (`TravelSessionResponse`).
- **Bug fix in scope**: `shared/models/transit-alert.model.ts`'s `TransitAlertStatus`
  was a string-literal union (`'Delayed' | ...`), but the real backend enum has no
  `JsonStringEnumConverter` registered anywhere — it serializes as a number like every
  other enum in this API. `TravelOption.serviceStatus` is exactly this type, so this
  bug was directly in F05's critical path; fixed to a numeric enum. Not previously
  caught because `TransitAlertService` (T07) had never actually been called from a
  real page before now.
- `modules/trip-planning/services/places.service.ts` (`GET /places/search?q=`) and
  `.../travel-options.service.ts` (`POST /travel-options`) — new, feature-scoped.
  `shared/services/travel-sessions.service.ts` (`POST /travel-sessions`) — new,
  shared, since F07/F08 will also need to mutate a `TravelSession`.
- `shared/services/geolocation.service.ts` — new; wraps
  `navigator.geolocation.getCurrentPosition` in an `Observable`, since
  `POST /travel-options` requires real `currentLatitude`/`currentLongitude` the
  prototype never actually fetched. Denied/unsupported geolocation gets its own
  inline error + "ลองใหม่" retry affordance (not the generic error banner) since the
  whole page is unusable without it.
- `modules/trip-planning/helpers/service-status.helper.ts` — pure
  `serviceStatusLabel`/`serviceStatusClasses` functions replacing
  `prototype/prototype-status.ts`, now deriving from the real nested
  `ServiceStatusResult` (`transitAlert` + `notOperatingToday`) instead of a flat mock
  string, extended with `RouteChanged`/not-operating-today cases the prototype never
  had to handle.
- Flow: destination input is debounced (300ms) into `PlacesService.search`; picking a
  result triggers `TravelOptionsService.search` with the resolved position; each
  result card's "เริ่มเดินทาง" button opens `ConfirmDialogComponent`
  ([F02](F02-shared-frontend-infrastructure.md)); confirming calls
  `TravelSessionsService.create`, then `ActiveSessionService.setActiveSessionId` and
  navigates to `/travel-session/:id` ([F03](F03-app-shell-navigation.md)).
- **Small F02 addition**: `ConfirmDialogComponent` gained a `confirming` input —
  disables both buttons and blocks Escape/backdrop dismissal while the confirmed
  action's HTTP call is in flight, so a slow `POST /travel-sessions` can't be
  double-submitted or cancelled mid-flight. Every future fold ticket confirming a
  mutating action gets this for free.
- Applied F04's decided pattern exactly: skeleton shapes matched to the real card
  (Variant B's shape) for both the destination dropdown and the results list; the
  contextual error banner (Variant D) subscribes to `ErrorNotificationService` and
  renders once, at the top of the page content.
- **Cleanup** (per F04's resolution — the decision is locked, so nothing needs the
  comparison scaffolding anymore): deleted `pages/trip-planning-home/prototype/`
  (T12's Variants B/C, the mock data, and the old status helper) and the entire
  `shared/components/prototype-loading-error/` folder (all 4 F04 variants + its
  switcher) — since every remaining fold ticket (F06-F08) will hand-implement the same
  already-decided skeleton/banner pattern directly, not reference the comparison
  demo. Removed the now-dangling `<app-loading-error-demo>` mount from
  `travel-session-home` (added there in F04, only for side-by-side comparison);
  `travel-session`'s own T14 layout switcher is untouched — that's F07's fold, not
  this one.

**Backend gap found and fixed while manually verifying this ticket** (affects every
fold ticket, not just this one — noted here since this is where it surfaced): the
Angular dev server (`localhost:4200`) and the API (`localhost:5261`) are different
origins with no CORS policy and no dev proxy bridging them, so every request was
blocked by the browser before reaching a controller; `Program.cs` also forced every
request onto HTTPS (`UseHttpsRedirection`), redirecting to `https://localhost:7057`,
which the browser then also blocks (untrusted local dev certificate) — same symptom
either way (`Http failure response ... 0 Unknown Error`). Fixed in
`backend/BusNavigate.Server/Program.cs`: added a `Cors:AllowedOrigins`-driven CORS
policy (empty/closed by default, `http://localhost:4200` in local
`appsettings.Development.json`, gitignored per repo convention — the tracked template
is `appsettings.Example.json`, updated with the same key) and skip
`UseHttpsRedirection` in `Development`, matching the stock ASP.NET Core Web API
template. Verified: `dotnet build`/`dotnet test` (100/100) both clean (built to a
scratch output dir — the backend was already running via Visual Studio and locking
its own `bin/`), `dotnet format --verify-no-changes` clean. Not verified against a
live reload of the running server in this environment; requires restarting the
backend process to pick up the change.

Verified: `npm run test` (92/92 passing, 27 new), `tsc --noEmit -p tsconfig.app.json`
and `-p tsconfig.spec.json`, `ng build --configuration production` all clean, and
manually in-browser — location denied/retry, debounced destination search, and a
failed `POST /places/search` (no backend running in this environment) all rendering
exactly as designed, including the F04 contextual error banner appearing and
dismissing correctly. Could not verify against real seeded data — the backend needs a
Postgres instance (`appsettings.json`'s `ConnectionStrings:BusNavigate`) not available
in this environment; the create-session → navigate step is covered by the component
test suite's mocked `TravelSessionsService` instead of a live run.

Reviewed via `/code-review` (Standards + Spec, two parallel axes); Spec axis found
nothing to fix. Standards axis found two real issues, both fixed:
- `TransitAlertInfo.description`/`.effectiveTo` and the new `EvaluationReason.value`
  were typed `| undefined` instead of `| null` — these mirror genuinely nullable
  backend fields (`string?`/`decimal?`), which deserialize as JSON `null`, not an
  absent key, so `frontend/CLAUDE.md`'s "`null` mirrors a nullable API field" rule
  applies. Fixed to `| null` (only the fields actually touched by this ticket — the
  pre-existing, unrelated `ServiceStatusResult.transitAlert: | undefined` was left
  alone, out of scope here).
- Three `.subscribe()` calls in `trip-planning-home.component.ts`
  (`loadCurrentPosition`, `searchTravelOptions`, `onConfirmStartTrip`) were unmanaged,
  violating "never leave a manual `.subscribe()` unmanaged." Fixed by piping all five
  subscriptions in the component through `takeUntilDestroyed(this.destroyRef)`.
