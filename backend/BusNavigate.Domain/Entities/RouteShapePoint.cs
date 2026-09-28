namespace BusNavigate.Domain.Entities;

public class RouteShapePoint
{
    public int DirectionId { get; set; }

    public Direction Direction { get; set; } = null!;

    public int Sequence { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }
}
