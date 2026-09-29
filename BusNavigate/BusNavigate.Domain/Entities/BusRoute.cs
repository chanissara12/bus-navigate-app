namespace BusNavigate.Domain.Entities;

public class BusRoute
{
    public int Id { get; set; }

    public string ExternalRouteId { get; set; } = string.Empty;

    public string ShortName { get; set; } = string.Empty;

    public string LongName { get; set; } = string.Empty;

    public string AgencyName { get; set; } = string.Empty;

    public string DataSource { get; set; } = string.Empty;

    public DateTime ImportedAt { get; set; }

    public ICollection<Direction> Directions { get; set; } = [];
}
