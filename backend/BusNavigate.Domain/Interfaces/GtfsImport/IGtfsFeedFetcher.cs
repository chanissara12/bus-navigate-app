namespace BusNavigate.Domain.Interfaces.GtfsImport;

public interface IGtfsFeedFetcher
{
    Task<GtfsFeedFiles> FetchLatestAsync(CancellationToken cancellationToken = default);
}
