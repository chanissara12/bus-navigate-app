namespace BusNavigate.Domain.Interfaces.GtfsImport;

public interface IGtfsFeedFetcher
{
    Task<GtfsFeedFiles> FetchLatestAsync(CancellationToken cancellationToken = default);

    Task<string?> GetLatestVersionAsync(CancellationToken cancellationToken = default);

    Task<(string Trips, string Shapes)> FetchLatestShapeFeedAsync(CancellationToken cancellationToken = default);
}
