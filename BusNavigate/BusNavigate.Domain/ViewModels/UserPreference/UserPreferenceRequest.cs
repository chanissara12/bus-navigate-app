namespace BusNavigate.Domain.ViewModels.UserPreference;

// PUT body — full replace of all three toggles, no partial-patch semantics (01).
public record UserPreferenceRequest(
    bool MinimizeWalking,
    bool MinimizeTransfers,
    bool AvoidStreetCrossing);
