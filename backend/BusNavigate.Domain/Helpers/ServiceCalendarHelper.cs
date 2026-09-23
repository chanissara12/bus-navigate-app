using BusNavigate.Domain.Entities;

namespace BusNavigate.Domain.Helpers;

// Standard GTFS effective-service-day resolution: weekly recurrence (ServiceCalendar's
// day flags + date range), overridden by any ServiceException for that exact date.
// Pure function — caller pre-filters exceptionsOnDate to just this calendar and date.
public static class ServiceCalendarHelper
{
    public static bool IsActiveOn(
        ServiceCalendar calendar, DateOnly date, IEnumerable<ServiceException> exceptionsOnDate)
    {
        var exceptions = exceptionsOnDate as ICollection<ServiceException> ?? [.. exceptionsOnDate];

        if (exceptions.Any(e => e.ExceptionType == ServiceExceptionType.Removed))
        {
            return false;
        }

        if (exceptions.Any(e => e.ExceptionType == ServiceExceptionType.Added))
        {
            return true;
        }

        if (date < calendar.StartDate || date > calendar.EndDate)
        {
            return false;
        }

        return date.DayOfWeek switch
        {
            DayOfWeek.Monday => calendar.Monday,
            DayOfWeek.Tuesday => calendar.Tuesday,
            DayOfWeek.Wednesday => calendar.Wednesday,
            DayOfWeek.Thursday => calendar.Thursday,
            DayOfWeek.Friday => calendar.Friday,
            DayOfWeek.Saturday => calendar.Saturday,
            DayOfWeek.Sunday => calendar.Sunday,
            _ => false,
        };
    }
}
