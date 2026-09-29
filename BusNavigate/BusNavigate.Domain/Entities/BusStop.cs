namespace BusNavigate.Domain.Entities;

public class BusStop
{
    public int Id { get; set; }

    public string ExternalStopId { get; set; } = string.Empty;

    public string NameTh { get; set; } = string.Empty;

    public string NameEn { get; set; } = string.Empty;

    public string? StopCode { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public RoadSide RoadSide { get; set; } = RoadSide.Unknown;

    public ICollection<RouteStop> RouteStops { get; set; } = [];
}
