using BusNavigate.Domain.Database;
using BusNavigate.Domain.Interfaces.BusStop;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BusNavigate.Service.Implements.BusStop;

public class StopLandmarkFetcher : IStopLandmarkFetcher
{
    // ~1.1km — generous margin around the bounding box so landmarks just outside the
    // outermost stops' exact coordinates aren't missed.
    private const decimal BoundingBoxMarginDegrees = 0.01m;

    private readonly HttpClient _httpClient;
    private readonly BusNavigateDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<StopLandmarkFetcher> _logger;

    public StopLandmarkFetcher(
        HttpClient httpClient, BusNavigateDbContext dbContext, IConfiguration configuration, ILogger<StopLandmarkFetcher> logger)
    {
        _httpClient = httpClient;
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> FetchLandmarksAsync(CancellationToken cancellationToken = default)
    {
        var stopCoordinates = await _dbContext.BusStops
            .Select(s => new { s.Latitude, s.Longitude })
            .ToListAsync(cancellationToken);

        if (stopCoordinates.Count == 0)
        {
            return """{"elements":[]}""";
        }

        var minLat = stopCoordinates.Min(s => s.Latitude) - BoundingBoxMarginDegrees;
        var maxLat = stopCoordinates.Max(s => s.Latitude) + BoundingBoxMarginDegrees;
        var minLon = stopCoordinates.Min(s => s.Longitude) - BoundingBoxMarginDegrees;
        var maxLon = stopCoordinates.Max(s => s.Longitude) + BoundingBoxMarginDegrees;

        var overpassUrl = _configuration["StopLandmarkSync:OverpassUrl"];
        if (string.IsNullOrWhiteSpace(overpassUrl))
        {
            throw new InvalidOperationException("StopLandmarkSync:OverpassUrl is not configured.");
        }

        // One query covering every known BusStop's area (see IStopLandmarkFetcher) —
        // a fixed tag list matching LandmarkType's cases, not exhaustive; extend as
        // new LandmarkType values are added. Unverified against the real Overpass API
        // (no network access in this session).
        var bbox = $"{minLat},{minLon},{maxLat},{maxLon}";
        var query = $"""
            [out:json][timeout:60];
            (
              node["highway"="crossing"]({bbox});
              way["highway"="footway"]["bridge"="yes"]({bbox});
              node["entrance"]({bbox});
              node["railway"="station"]({bbox});
              way["railway"="station"]({bbox});
            );
            out center;
            """;

        _logger.LogInformation("Querying Overpass API for stop landmarks");

        using var content = new FormUrlEncodedContent([new KeyValuePair<string, string>("data", query)]);
        using var response = await _httpClient.PostAsync(overpassUrl, content, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}
