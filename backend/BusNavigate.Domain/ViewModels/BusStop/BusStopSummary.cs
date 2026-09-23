namespace BusNavigate.Domain.ViewModels.BusStop;

public record BusStopSummary(
    int Id, string NameTh, string NameEn, string? StopCode, decimal Latitude, decimal Longitude, double DistanceMeters);
