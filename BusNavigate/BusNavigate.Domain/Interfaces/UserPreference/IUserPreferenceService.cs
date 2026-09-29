using UserPreferenceEntity = BusNavigate.Domain.Entities.UserPreference;

namespace BusNavigate.Domain.Interfaces.UserPreference;

public interface IUserPreferenceService
{
    // Returns the user's saved preference, or an unsaved default (all toggles off) if
    // none exists yet — never throws for a missing row (01).
    Task<UserPreferenceEntity> GetAsync(int userId, CancellationToken cancellationToken = default);

    // Full replace, single upsert — no partial-patch semantics (01).
    Task<UserPreferenceEntity> SetAsync(
        int userId, bool minimizeWalking, bool minimizeTransfers, bool avoidStreetCrossing,
        CancellationToken cancellationToken = default);
}
