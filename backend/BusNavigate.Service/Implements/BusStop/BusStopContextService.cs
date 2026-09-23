using BusNavigate.Domain.Database;
using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Interfaces.BusStop;
using BusNavigate.Domain.ViewModels.BusStop;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Implements.BusStop;

public class BusStopContextService : IBusStopContextService
{
    private readonly BusNavigateDbContext _dbContext;

    public BusStopContextService(BusNavigateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<BusStopContextResult> GetContextAsync(int busStopId, CancellationToken cancellationToken = default)
    {
        var busStop = await _dbContext.BusStops
            .FirstOrDefaultAsync(s => s.Id == busStopId, cancellationToken)
            ?? throw new ValidateException($"BusStop {busStopId} was not found.");

        // Empty list, never an error, when a stop has zero landmarks — T08's
        // graceful-degradation rule.
        var landmarks = await _dbContext.StopLandmarks
            .Where(l => l.BusStopId == busStopId)
            .OrderBy(l => l.DistanceMeters)
            .Select(l => new StopLandmarkInfo(l.LandmarkType, l.NameTh, l.NameEn, l.Description, l.DistanceMeters))
            .ToListAsync(cancellationToken);

        return new BusStopContextResult(
            busStop.Id, busStop.NameTh, busStop.NameEn, busStop.StopCode, busStop.Latitude, busStop.Longitude, landmarks);
    }
}
