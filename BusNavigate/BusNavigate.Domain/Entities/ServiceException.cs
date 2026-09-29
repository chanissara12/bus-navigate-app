namespace BusNavigate.Domain.Entities;

// A dated override to ServiceCalendar for a specific service (e.g. no service on a
// public holiday). Maps from GTFS calendar_dates.txt exception_type 1/2.
public class ServiceException
{
    public int Id { get; set; }

    public int ServiceCalendarId { get; set; }

    public ServiceCalendar ServiceCalendar { get; set; } = null!;

    public DateOnly ExceptionDate { get; set; }

    public ServiceExceptionType ExceptionType { get; set; }
}
