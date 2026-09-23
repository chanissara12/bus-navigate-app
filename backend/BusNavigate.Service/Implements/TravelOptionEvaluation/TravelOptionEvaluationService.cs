using BusNavigate.Domain.Constants;
using BusNavigate.Domain.Database;
using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Helpers;
using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using BusNavigate.Domain.ViewModels.TravelOptionEvaluation;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Implements.TravelOptionEvaluation;

public class TravelOptionEvaluationService : ITravelOptionEvaluationService
{
    private readonly BusNavigateDbContext _dbContext;

    public TravelOptionEvaluationService(BusNavigateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // TravelSession has no multi-leg/transfer modeling yet (same limitation noted in
    // T04's ALIGHTED->COMPLETED comment), so both the original plan's and every
    // candidate's transfer count are fixed at 0 in Phase 1's current data model. T05's
    // rule 2 (">1 additional transfer -> reject") can never trigger today — kept here,
    // not deleted, so it activates for free once transfer modeling lands.
    private const int OriginalTransferCount = 0;
    private const int CandidateTransferCount = 0;

    public async Task<TravelOptionEvaluationResult> EvaluateAsync(
        int travelSessionId, int candidateDirectionId, CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.TravelSessions
            .Include(s => s.AlightingStop)
            .FirstOrDefaultAsync(s => s.Id == travelSessionId, cancellationToken)
            ?? throw new ValidateException($"Travel session {travelSessionId} was not found.");

        var candidateRouteStops = await _dbContext.RouteStops
            .Where(rs => rs.DirectionId == candidateDirectionId)
            .Include(rs => rs.BusStop)
            .ToListAsync(cancellationToken);

        if (candidateRouteStops.Count == 0)
        {
            throw new ValidateException($"Direction {candidateDirectionId} was not found or has no stops.");
        }

        // Destination, for Phase 1's single-leg TravelSession, is the plan's own
        // AlightingStop (see T04) — there's no separate Destination/Place concept yet.
        var destination = session.AlightingStop;

        var nearestStopDistanceMeters = candidateRouteStops
            .Select(routeStop => GeoDistanceHelper.HaversineDistanceMeters(
                routeStop.BusStop.Latitude, routeStop.BusStop.Longitude,
                destination.Latitude, destination.Longitude))
            .Min();

        var walkDistanceMeters = nearestStopDistanceMeters * TravelOptionEvaluationConstants.WalkingDetourFactor;

        var extraTransfers = CandidateTransferCount - OriginalTransferCount;

        // Rules 1 and 3 collapse into this one check in Phase 1's data model: without a
        // separate transfer-point search, "no RouteStop within walk budget of the
        // Destination" (rule 1) and "alighting-to-destination distance exceeds the walk
        // budget" (rule 3) are the same measurement here — the nearest candidate stop's
        // walking distance to the destination.
        if (walkDistanceMeters > TravelOptionEvaluationConstants.WalkBudgetMeters)
        {
            // Value carries the actual walk distance so a caller can rank multiple
            // rejected candidates by "how close it got" (T06's last-resort ranking).
            return new TravelOptionEvaluationResult(
                Accepted: false,
                Reasons: [new EvaluationReason(ReasonCode.DoesNotReachDestination, (decimal)walkDistanceMeters)]);
        }

        if (extraTransfers > 1)
        {
            return new TravelOptionEvaluationResult(
                Accepted: false,
                Reasons: [new EvaluationReason(ReasonCode.ExtraTransferCount, extraTransfers)]);
        }

        List<EvaluationReason> reasons =
        [
            new EvaluationReason(ReasonCode.ReachesDestination),
            extraTransfers > 0
                ? new EvaluationReason(ReasonCode.ExtraTransferCount, extraTransfers)
                : new EvaluationReason(ReasonCode.NoTransfer),
            new EvaluationReason(ReasonCode.WithinWalkBudget, (decimal)walkDistanceMeters),
        ];

        return new TravelOptionEvaluationResult(Accepted: true, Reasons: reasons);
    }
}
