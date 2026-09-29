namespace BusNavigate.Domain.ViewModels.BusStop;

// Shape matches T09's GET /bus-stops/{id} response: BusStop + StopLandmark[] (empty
// array if none, never an error — T08's graceful-degradation rule).
public record BusStopContextResult(
    int BusStopId,
    string NameTh,
    string NameEn,
    string? StopCode,
    decimal Latitude,
    decimal Longitude,
    IReadOnlyList<StopLandmarkInfo> Landmarks
);
