using BusNavigate.Domain.Database;
using BusNavigate.Domain.Interfaces.UserPreference;
using Microsoft.EntityFrameworkCore;
using UserPreferenceEntity = BusNavigate.Domain.Entities.UserPreference;

namespace BusNavigate.Service.Implements.UserPreference;

public class UserPreferenceService : IUserPreferenceService
{
    private readonly BusNavigateDbContext _dbContext;

    public UserPreferenceService(BusNavigateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserPreferenceEntity> GetAsync(int userId, CancellationToken cancellationToken = default)
    {
        var preference = await _dbContext.UserPreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        return preference ?? new UserPreferenceEntity { UserId = userId };
    }

    public async Task<UserPreferenceEntity> SetAsync(
        int userId, bool minimizeWalking, bool minimizeTransfers, bool avoidStreetCrossing,
        CancellationToken cancellationToken = default)
    {
        var preference = await _dbContext.UserPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (preference is null)
        {
            preference = new UserPreferenceEntity { UserId = userId };
            _dbContext.UserPreferences.Add(preference);
        }

        preference.MinimizeWalking = minimizeWalking;
        preference.MinimizeTransfers = minimizeTransfers;
        preference.AvoidStreetCrossing = avoidStreetCrossing;
        preference.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return preference;
    }
}
