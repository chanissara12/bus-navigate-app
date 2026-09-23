using System.IO.Compression;
using BusNavigate.Domain.Interfaces.GtfsImport;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BusNavigate.Service.Implements.GtfsImport;

public class GtfsFeedFetcher : IGtfsFeedFetcher
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GtfsFeedFetcher> _logger;

    public GtfsFeedFetcher(HttpClient httpClient, IConfiguration configuration, ILogger<GtfsFeedFetcher> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<GtfsFeedFiles> FetchLatestAsync(CancellationToken cancellationToken = default)
    {
        var feedUrl = _configuration["GtfsImport:FeedUrl"];
        if (string.IsNullOrWhiteSpace(feedUrl))
        {
            throw new InvalidOperationException("GtfsImport:FeedUrl is not configured.");
        }

        _logger.LogInformation("Downloading GTFS feed from {FeedUrl}", feedUrl);

        await using var zipStream = await _httpClient.GetStreamAsync(feedUrl, cancellationToken);
        using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read);

        return new GtfsFeedFiles(
            Agency: ReadEntry(archive, "agency.txt"),
            Routes: ReadEntry(archive, "routes.txt"),
            Trips: ReadEntry(archive, "trips.txt"),
            Stops: ReadEntry(archive, "stops.txt"),
            StopTimes: ReadEntry(archive, "stop_times.txt"),
            Calendar: ReadEntry(archive, "calendar.txt"),
            CalendarDates: ReadEntry(archive, "calendar_dates.txt")
        );
    }

    private static string ReadEntry(ZipArchive archive, string entryName)
    {
        var entry = archive.GetEntry(entryName)
            ?? throw new InvalidOperationException($"GTFS feed is missing required file '{entryName}'.");

        using var reader = new StreamReader(entry.Open());
        return reader.ReadToEnd();
    }
}
