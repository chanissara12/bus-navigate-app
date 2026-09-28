# 01: Store and read UserPreference (schema + API)

**What to build:** A rider's accessibility preference (three independent toggles:
minimize walking, minimize transfers, avoid street crossing) can be set and read back
through the API, tied to their existing anonymous device-scoped identity. No rider
identity mechanism changes — this reuses the device-id-based user resolution already
in place. Absence of a saved preference reads back as all three toggles off, never an
error.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A `UserPreference` record can be created for a device that has never set one
      before, via a single upsert call — no separate "create" step.
- [ ] The same device's saved preference is read back correctly on a later, separate
      request.
- [ ] A device that has never set a preference reads back all three toggles as off,
      not an error and not a missing-resource response.
- [ ] Setting a preference again (same device) replaces the previous value entirely —
      the endpoint fully replaces the set of toggles, it does not partially patch.
- [ ] One device's preference is never visible to, or affected by, another device's
      requests.
