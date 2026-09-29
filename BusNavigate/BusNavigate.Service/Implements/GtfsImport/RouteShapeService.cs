using BusNavigate.Domain.Database;
using BusNavigate.Domain.Interfaces.GtfsImport;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Implements.GtfsImport;

public class RouteShapeService : IRouteShapeService
{
    private readonly BusNavigateDbContext _dbContext;

    public RouteShapeService(BusNavigateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<RouteShapePointResult>> GetShapeAsync(
        int directionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.RouteShapePoints
            .AsNoTracking()
            .Where(point => point.DirectionId == directionId)
            .OrderBy(point => point.Sequence)
            .Select(point => new RouteShapePointResult(
                point.Sequence,
                point.Latitude,
                point.Longitude))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RouteShapeResult>> GetAllShapesAsync(
        CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.RouteShapePoints
            .AsNoTracking()
            .Join(
                _dbContext.Directions,
                point => point.DirectionId,
                direction => direction.Id,
                (point, direction) => new
                {
                    point.DirectionId,
                    direction.Headsign,
                    RouteShortName = direction.BusRoute.ShortName,
                    point.Sequence,
                    point.Latitude,
                    point.Longitude
                })
            .OrderBy(row => row.DirectionId)
            .ThenBy(row => row.Sequence)
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(row => new { row.DirectionId, row.RouteShortName, row.Headsign })
            .Select(group => new RouteShapeResult(
                group.Key.DirectionId,
                group.Key.RouteShortName,
                group.Key.Headsign,
                group.Select(point => new RouteShapePointResult(
                    point.Sequence,
                    point.Latitude,
                    point.Longitude)).ToList()))
            .ToList();
    }
}
