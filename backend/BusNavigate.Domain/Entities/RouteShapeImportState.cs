namespace BusNavigate.Domain.Entities;

public class RouteShapeImportState
{
    public string Id { get; set; } = string.Empty;

    public string FeedVersion { get; set; } = string.Empty;

    public DateTime ImportedAt { get; set; }
}
