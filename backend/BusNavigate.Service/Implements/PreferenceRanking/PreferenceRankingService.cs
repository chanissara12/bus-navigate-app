using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Interfaces.PreferenceRanking;
using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using BusNavigate.Domain.ViewModels.TravelOptionEvaluation;
using Microsoft.EntityFrameworkCore;
using UserPreferenceEntity = BusNavigate.Domain.Entities.UserPreference;

namespace BusNavigate.Service.Implements.PreferenceRanking;

public class PreferenceRankingService : IPreferenceRankingService
{
    private readonly BusNavigateDbContext _dbContext;

    public PreferenceRankingService(BusNavigateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Crossing tier per stop, lower is better: a Skywalk landmark makes the stop
    // favorable; neither landmark type present is neutral (03: "never penalized" when
    // there's no data); an at-grade Crossing landmark with no Skywalk is unfavorable.
    private const int CrossingTierFavorable = 0;
    private const int CrossingTierNeutral = 1;
    private const int CrossingTierUnfavorable = 2;

    public async Task<IReadOnlyList<T>> RankAsync<T>(
        IReadOnlyList<T> candidates,
        UserPreferenceEntity preference,
        Func<T, double> getWalkingDistanceMeters,
        Func<T, int> getTransferCount,
        Func<T, int?> getBoardingStopId,
        Func<T, int?> getAlightingStopId,
        Func<T, IReadOnlyList<EvaluationReason>> getReasons,
        Func<T, IReadOnlyList<EvaluationReason>, T> withReasons,
        CancellationToken cancellationToken = default)
    {
        if (candidates.Count == 0 ||
            (!preference.MinimizeWalking && !preference.MinimizeTransfers && !preference.AvoidStreetCrossing))
        {
            return candidates;
        }

        var walkingValues = candidates.Select(getWalkingDistanceMeters).ToList();
        var transferValues = candidates.Select(getTransferCount).ToList();

        Dictionary<int, int>? crossingTierByStopId = preference.AvoidStreetCrossing
            ? await BuildCrossingTierLookupAsync(candidates, getBoardingStopId, getAlightingStopId, cancellationToken)
            : null;
        var crossingTiers = candidates
            .Select(c => CombineCrossingTier(getBoardingStopId(c), getAlightingStopId(c), crossingTierByStopId))
            .ToList();

        var walkingRanks = preference.MinimizeWalking ? RankAscending(walkingValues) : null;
        var transferRanks = preference.MinimizeTransfers ? RankAscending(transferValues.Select(v => (double)v).ToList()) : null;
        var crossingRanks = preference.AvoidStreetCrossing ? RankAscending(crossingTiers.Select(v => (double)v).ToList()) : null;

        // Only tag a match when the criterion actually discriminates between
        // candidates — e.g. every trip-planning candidate ties at 0 transfers in Phase 1
        // (no multi-leg search yet), so nothing is tagged "matches minimize transfers"
        // there, correctly reflecting that the toggle had nothing to act on (03).
        var walkingHasVariance = walkingValues.Distinct().Count() > 1;
        var transferHasVariance = transferValues.Distinct().Count() > 1;
        var minWalking = walkingValues.Min();
        var minTransfers = transferValues.Min();

        var enriched = new List<T>(candidates.Count);
        for (var i = 0; i < candidates.Count; i++)
        {
            var candidate = candidates[i];
            var newReasons = new List<EvaluationReason>();

            if (preference.MinimizeWalking && walkingHasVariance && walkingValues[i] == minWalking)
            {
                newReasons.Add(new EvaluationReason(ReasonCode.MatchesMinimizeWalking));
            }

            if (preference.MinimizeTransfers && transferHasVariance && transferValues[i] == minTransfers)
            {
                newReasons.Add(new EvaluationReason(ReasonCode.MatchesMinimizeTransfers));
            }

            if (preference.AvoidStreetCrossing && crossingTiers[i] == CrossingTierFavorable)
            {
                newReasons.Add(new EvaluationReason(ReasonCode.MatchesAvoidStreetCrossing));
            }

            enriched.Add(newReasons.Count > 0
                ? withReasons(candidate, [.. getReasons(candidate), .. newReasons])
                : candidate);
        }

        // Unweighted combination (03: "no per-preference importance weighting") — sum
        // each active criterion's ordinal rank rather than raw values, since meters, a
        // transfer count, and a crossing tier are on incomparable scales.
        var combinedScores = new int[candidates.Count];
        for (var i = 0; i < candidates.Count; i++)
        {
            combinedScores[i] = (walkingRanks?[i] ?? 0) + (transferRanks?[i] ?? 0) + (crossingRanks?[i] ?? 0);
        }

        return [.. enriched
            .Select((candidate, index) => (Candidate: candidate, Score: combinedScores[index], Index: index))
            .OrderBy(x => x.Score)
            .ThenBy(x => x.Index)
            .Select(x => x.Candidate)];
    }

    // Ordinal rank per value (0 = best/lowest) via a stable sort on original index —
    // ties keep their original relative order, which is also what guarantees "no
    // preference set -> exact same order" for the untouched criteria.
    private static int[] RankAscending(IReadOnlyList<double> values)
    {
        var ranks = new int[values.Count];
        var order = Enumerable.Range(0, values.Count).OrderBy(i => values[i]).ToList();
        for (var rank = 0; rank < order.Count; rank++)
        {
            ranks[order[rank]] = rank;
        }
        return ranks;
    }

    private async Task<Dictionary<int, int>> BuildCrossingTierLookupAsync<T>(
        IReadOnlyList<T> candidates, Func<T, int?> getBoardingStopId, Func<T, int?> getAlightingStopId,
        CancellationToken cancellationToken)
    {
        var stopIds = candidates
            .SelectMany(c => new[] { getBoardingStopId(c), getAlightingStopId(c) })
            .Where(id => id is not null)
            .Select(id => id!.Value)
            .ToHashSet();

        var landmarks = await _dbContext.StopLandmarks
            .Where(l => stopIds.Contains(l.BusStopId) &&
                (l.LandmarkType == LandmarkType.Skywalk || l.LandmarkType == LandmarkType.Crossing))
            .Select(l => new { l.BusStopId, l.LandmarkType })
            .ToListAsync(cancellationToken);

        var skywalkStopIds = landmarks.Where(l => l.LandmarkType == LandmarkType.Skywalk).Select(l => l.BusStopId).ToHashSet();
        var crossingStopIds = landmarks.Where(l => l.LandmarkType == LandmarkType.Crossing).Select(l => l.BusStopId).ToHashSet();

        var tierByStopId = new Dictionary<int, int>();
        foreach (var stopId in stopIds)
        {
            tierByStopId[stopId] = skywalkStopIds.Contains(stopId)
                ? CrossingTierFavorable
                : crossingStopIds.Contains(stopId)
                    ? CrossingTierUnfavorable
                    : CrossingTierNeutral;
        }

        return tierByStopId;
    }

    // Worst-case across both legs — a rider walks both, so a hazard on either leg still
    // means the option carries that hazard (03: confirmed with the user).
    private static int CombineCrossingTier(int? boardingStopId, int? alightingStopId, Dictionary<int, int>? tierByStopId)
    {
        if (tierByStopId is null)
        {
            return CrossingTierNeutral;
        }

        var tiers = new List<int>();
        if (boardingStopId is int boarding && tierByStopId.TryGetValue(boarding, out var boardingTier))
        {
            tiers.Add(boardingTier);
        }
        if (alightingStopId is int alighting && tierByStopId.TryGetValue(alighting, out var alightingTier))
        {
            tiers.Add(alightingTier);
        }

        return tiers.Count > 0 ? tiers.Max() : CrossingTierNeutral;
    }
}
