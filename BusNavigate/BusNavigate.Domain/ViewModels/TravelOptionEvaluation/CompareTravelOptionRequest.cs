namespace BusNavigate.Domain.ViewModels.TravelOptionEvaluation;

// T09's POST /travel-options/compare body. candidateRouteId from the ticket's literal
// shape is omitted — candidateDirectionId already implies its Route (Direction.BusRouteId),
// so it isn't needed server-side.
public record CompareTravelOptionRequest(int CurrentTravelSessionId, int CandidateDirectionId);
