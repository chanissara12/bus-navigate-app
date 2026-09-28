namespace BusNavigate.Domain.ViewModels.UserPreference;

public record UserPreferenceResponse(
    bool MinimizeWalking,
    bool MinimizeTransfers,
    bool AvoidStreetCrossing,
    DateTime? UpdatedAt);
