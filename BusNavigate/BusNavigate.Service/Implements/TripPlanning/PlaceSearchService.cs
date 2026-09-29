using BusNavigate.Domain.Database;
using BusNavigate.Domain.Interfaces.TripPlanning;
using BusNavigate.Domain.ViewModels.TripPlanning;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Implements.TripPlanning;

public class PlaceSearchService : IPlaceSearchService
{
    private const int MaxResults = 20;

    private readonly BusNavigateDbContext _dbContext;

    public PlaceSearchService(BusNavigateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<PlaceSearchResult>> SearchAsync(
        string query, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return [];
        }

        // ToLower().Contains() rather than EF.Functions.ILike — portable across the
        // Npgsql provider (production) and the InMemory provider (unit tests), unlike
        // ILike which only Npgsql can translate.
        var lowerQuery = query.ToLower();

        var stopMatches = await _dbContext.BusStops
            .Where(s => s.NameTh.ToLower().Contains(lowerQuery) ||
                s.NameEn.ToLower().Contains(lowerQuery) ||
                (s.StopCode != null && s.StopCode.ToLower().Contains(lowerQuery)))
            .Select(s => new PlaceSearchResult(s.Id, PlaceKind.BusStop, s.NameTh, s.NameEn, s.Latitude, s.Longitude))
            .ToListAsync(cancellationToken);

        var placeMatches = await _dbContext.Places
            .Where(p => p.Name.ToLower().Contains(lowerQuery))
            // Place has no NameTh/NameEn split (T06) — both sides use the same Name,
            // matching GtfsParser's stop_name_en fallback-to-stop_name precedent.
            .Select(p => new PlaceSearchResult(p.Id, PlaceKind.Place, p.Name, p.Name, p.Latitude, p.Longitude))
            .ToListAsync(cancellationToken);

        return [.. RankByStartsWithFirst(stopMatches.Concat(placeMatches), query).Take(MaxResults)];
    }

    // "starts-with beats contains" — no deeper ranking (T11).
    private static IEnumerable<PlaceSearchResult> RankByStartsWithFirst(
        IEnumerable<PlaceSearchResult> results, string query) =>
        results.OrderByDescending(r =>
            r.NameTh.StartsWith(query, StringComparison.OrdinalIgnoreCase) ||
            r.NameEn.StartsWith(query, StringComparison.OrdinalIgnoreCase));
}
