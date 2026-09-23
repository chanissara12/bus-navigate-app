namespace BusNavigate.Domain.ViewModels.TravelSession;

// T09's literal shape is { travelOptionId } — but TravelOption is never persisted
// (T10: it's a computed result, only ever a ViewModels/<Feature>/ DTO), so there's no
// row to reference by id. The client instead re-submits the concrete fields from
// whichever TravelOption it picked (T11's search response already carries all of
// these).
public record CreateTravelSessionRequest(int DirectionId, int BoardingStopId, int AlightingStopId);
