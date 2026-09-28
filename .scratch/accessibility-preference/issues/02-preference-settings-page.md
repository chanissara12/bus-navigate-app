# 02: Preference settings page

**What to build:** A rider can open a settings screen, see the current state of all
three preference toggles (minimize walking, minimize transfers, avoid street
crossing), change them, and save. The saved state is still there the next time they
open the app, on the same device.

**Blocked by:** 01 (needs the storage/API to read from and write to)

**Status:** ready-for-agent

- [ ] Opening the settings screen shows each toggle in its currently-saved state
      (all off for a device that never set anything).
- [ ] Turning a toggle on or off and saving persists that change — reopening the app
      later shows the saved state, not the default.
- [ ] Turning a preference back off is just as easy as turning it on — no special flow
      needed to "reset."
- [ ] The screen is a simple settings form, not a multi-step wizard.
