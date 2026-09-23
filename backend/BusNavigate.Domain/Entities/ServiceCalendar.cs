namespace BusNavigate.Domain.Entities;

public class ServiceCalendar
{
    public int Id { get; set; }

    public string ExternalServiceId { get; set; } = string.Empty;

    public bool Monday { get; set; }

    public bool Tuesday { get; set; }

    public bool Wednesday { get; set; }

    public bool Thursday { get; set; }

    public bool Friday { get; set; }

    public bool Saturday { get; set; }

    public bool Sunday { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public ICollection<ServiceException> ServiceExceptions { get; set; } = [];

    public ICollection<Trip> Trips { get; set; } = [];
}
