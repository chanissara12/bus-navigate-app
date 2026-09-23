using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Helpers;

namespace BusNavigate.Service.Test.ServiceStatus;

public class ServiceCalendarHelperTests
{
    private static ServiceCalendar CreateWeekdayCalendar(DateOnly startDate, DateOnly endDate) => new()
    {
        Monday = true,
        Tuesday = true,
        Wednesday = true,
        Thursday = true,
        Friday = true,
        Saturday = false,
        Sunday = false,
        StartDate = startDate,
        EndDate = endDate,
    };

    [Fact]
    public void IsActiveOn_WeekdayCalendarOnAWeekday_ReturnsTrue()
    {
        // Arrange — 2026-01-05 is a Monday.
        var calendar = CreateWeekdayCalendar(new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31));

        // Act
        var result = ServiceCalendarHelper.IsActiveOn(calendar, new DateOnly(2026, 1, 5), []);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsActiveOn_WeekdayCalendarOnAWeekend_ReturnsFalse()
    {
        // Arrange — 2026-01-04 is a Sunday.
        var calendar = CreateWeekdayCalendar(new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31));

        // Act
        var result = ServiceCalendarHelper.IsActiveOn(calendar, new DateOnly(2026, 1, 4), []);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsActiveOn_DateOutsideCalendarRange_ReturnsFalse()
    {
        // Arrange
        var calendar = CreateWeekdayCalendar(new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 31));

        // Act — 2026-02-02 is a Monday, but past the calendar's EndDate.
        var result = ServiceCalendarHelper.IsActiveOn(calendar, new DateOnly(2026, 2, 2), []);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsActiveOn_RemovedExceptionOnAScheduledWeekday_ReturnsFalse()
    {
        // Arrange — a holiday override on an otherwise-scheduled Monday.
        var calendar = CreateWeekdayCalendar(new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31));
        var exceptions = new[]
        {
            new ServiceException { ExceptionDate = new DateOnly(2026, 1, 5), ExceptionType = ServiceExceptionType.Removed },
        };

        // Act
        var result = ServiceCalendarHelper.IsActiveOn(calendar, new DateOnly(2026, 1, 5), exceptions);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsActiveOn_AddedExceptionOnAScheduledWeekend_ReturnsTrue()
    {
        // Arrange — a special extra-service Saturday.
        var calendar = CreateWeekdayCalendar(new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31));
        var exceptions = new[]
        {
            new ServiceException { ExceptionDate = new DateOnly(2026, 1, 3), ExceptionType = ServiceExceptionType.Added },
        };

        // Act — 2026-01-03 is a Saturday.
        var result = ServiceCalendarHelper.IsActiveOn(calendar, new DateOnly(2026, 1, 3), exceptions);

        // Assert
        Assert.True(result);
    }
}
