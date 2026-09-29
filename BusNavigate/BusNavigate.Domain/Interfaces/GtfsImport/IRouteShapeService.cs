namespace BusNavigate.Domain.Interfaces.GtfsImport;

public interface IRouteShapeService
{
    Task<IReadOnlyList<RouteShapePointResult>> GetShapeAsync(
        int directionId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RouteShapeResult>> GetAllShapesAsync(
        CancellationToken cancellationToken = default);
}

public record RouteShapePointResult(
    int Sequence,
    decimal Latitude,
    decimal Longitude);

public record RouteShapeResult(
    int DirectionId,
    string RouteShortName,
    string Headsign,
    IReadOnlyList<RouteShapePointResult> Points);
