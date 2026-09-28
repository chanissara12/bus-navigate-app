# 04: Apply preference ranking to recovery's tiered results

**What to build:** The same shared ranking component from ticket 03 is applied to the
wrong-bus recovery flow's result, which is already split into tiers (recommended /
last-resort / unconfirmed-rail). Preference reordering happens independently *within*
each tier — it never moves an option from a lower tier above a higher one. Urgency
(which tier something is in) always outranks a rider's personal preference.

**Blocked by:** 03 (reuses its ranking logic; does not reimplement scoring)

**Status:** ready-for-agent

- [ ] With a preference set, the order of options *within* the recommended tier
      reflects it, the same way trip-planning results do.
- [ ] The same is true independently within the last-resort tier, and within the
      unconfirmed-rail tier.
- [ ] No preference, in any combination, ever causes an option from a lower-priority
      tier to be shown above an option from a higher-priority tier.
- [ ] With no preference set, all three tiers' internal ordering is unchanged from
      today's behavior.
- [ ] A reordered option within any tier carries the same visible preference-match
      reason that trip-planning results do.
