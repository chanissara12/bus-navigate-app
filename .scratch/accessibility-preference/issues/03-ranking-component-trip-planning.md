# 03: Shared preference-ranking component, applied to trip-planning search

**What to build:** A single, shared ranking component that reorders a list of
already-generated `TravelOption`s (or `RecoveryOption`s — this ticket wires it into
the first of its two call sites) according to a rider's `UserPreference`, without
removing any option from the list. Wired into the trip-planning search result path
first: a rider with a preference set sees their search results reordered accordingly,
with a visible reason attached to any option that moved because of a preference
match. This ticket owns all preference-scoring logic — the recovery call site (ticket
04) reuses this component rather than re-implementing scoring.

**Blocked by:** 01 (needs a `UserPreference` to read; can be exercised via the API
directly, does not need the settings page from 02)

**Status:** ready-for-agent

- [ ] With no preference set (or all toggles off), trip-planning search results come
      back in exactly the same order as before this change.
- [ ] With "minimize walking" on, results favor lower total walking distance.
- [ ] With "minimize transfers" on, results favor fewer transfers.
- [ ] With "avoid street crossing" on, results favor options whose boarding/alighting
      stop has nearby pedestrian-bridge landmark data over one with only an at-grade
      crossing nearby.
- [ ] An option with no nearby crossing/skywalk landmark data at all is neither favored
      nor penalized by the "avoid street crossing" toggle.
- [ ] Multiple toggles enabled together combine — no toggle is silently ignored when
      others are also on.
- [ ] Every option present before reordering is still present after — the toggle set
      only changes order, never removes an option.
- [ ] Any option whose position changed because of a preference match carries a new,
      visible reason explaining which preference it matched.
