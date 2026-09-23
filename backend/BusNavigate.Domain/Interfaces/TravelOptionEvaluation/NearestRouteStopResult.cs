namespace BusNavigate.Domain.Interfaces.TravelOptionEvaluation;

public record NearestRouteStopResult(int RouteStopId, int BusStopId, int SequenceNumber, double DistanceMeters);
