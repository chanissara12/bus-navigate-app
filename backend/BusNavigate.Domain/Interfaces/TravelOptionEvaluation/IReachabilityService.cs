namespace BusNavigate.Domain.Interfaces.TravelOptionEvaluation;

// Extracted out of TravelOptionEvaluationService (T11) so the initial trip-planning
// search (which needs the same "nearest RouteStop to a point" check but has no
// TravelSession to evaluate against yet) doesn't duplicate the haversine-plus-budget
// logic a third time.
public interface IReachabilityService
{
    // Null when the Direction has no RouteStops at all (unknown/empty Direction).
    Task<NearestRouteStopResult?> FindNearestRouteStopAsync(
        int directionId, decimal targetLatitude, decimal targetLongitude, CancellationToken cancellationToken = default);
}
