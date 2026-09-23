using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Exceptions;
using BusNavigate.Domain.Helpers;
using BusNavigate.Domain.Interfaces.ServiceStatus;
using BusNavigate.Domain.ViewModels.ServiceStatus;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Service.Implements.ServiceStatus;

public class ServiceStatusService : IServiceStatusService
{
    private readonly BusNavigateDbContext _dbContext;

    public ServiceStatusService(BusNavigateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ServiceStatusResult> GetStatusAsync(
        int busRouteId, int? directionId, CancellationToken cancellationToken = default)
    {
        var routeExists = await _dbContext.BusRoutes.AnyAsync(r => r.Id == busRouteId, cancellationToken);
        if (!routeExists)
        {
            throw new ValidateException($"BusRoute {busRouteId} was not found.");
        }

        // Thailand has no DST — a fixed UTC+7 offset is correct year-round and avoids
        // TimeZoneInfo id portability issues ("SE Asia Standard Time" on Windows vs.
        // "Asia/Bangkok" on Linux).
        var nowInBangkok = DateTime.UtcNow.AddHours(7);
        var today = DateOnly.FromDateTime(nowInBangkok);

        var notOperatingToday = await IsNotOperatingTodayAsync(busRouteId, directionId, today, cancellationToken);
        var transitAlert = await FindActiveAlertAsync(busRouteId, directionId, nowInBangkok, cancellationToken);

        return new ServiceStatusResult(transitAlert, notOperatingToday);
    }

    private async Task<bool> IsNotOperatingTodayAsync(
        int busRouteId, int? directionId, DateOnly today, CancellationToken cancellationToken)
    {
        var tripsInScope = _dbContext.Trips.Where(t => t.Direction.BusRouteId == busRouteId);
        if (directionId is int knownDirectionId)
        {
            tripsInScope = tripsInScope.Where(t => t.DirectionId == knownDirectionId);
        }

        var calendarIds = await tripsInScope
            .Select(t => t.ServiceCalendarId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (calendarIds.Count == 0)
        {
            // No trips at all in scope — vacuously not operating today.
            return true;
        }

        var calendars = await _dbContext.ServiceCalendars
            .Where(c => calendarIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        var exceptionsToday = await _dbContext.ServiceExceptions
            .Where(e => calendarIds.Contains(e.ServiceCalendarId) && e.ExceptionDate == today)
            .ToListAsync(cancellationToken);

        var isAnyCalendarActiveToday = calendars.Any(calendar => ServiceCalendarHelper.IsActiveOn(
            calendar, today, exceptionsToday.Where(e => e.ServiceCalendarId == calendar.Id)));

        return !isAnyCalendarActiveToday;
    }

    private async Task<TransitAlertInfo?> FindActiveAlertAsync(
        int busRouteId, int? directionId, DateTime nowInBangkok, CancellationToken cancellationToken)
    {
        // DirectionId == null matches whole-route alerts (always in scope); when
        // directionId is null too, this also correctly excludes direction-specific
        // alerts, since only "== null" then matches. Multiple simultaneously-active
        // alerts are unexpected for manual curation, but if it happens, the most
        // recently entered one wins (an admin correcting an earlier mistake).
        var alert = await _dbContext.TransitAlerts
            .Where(a => a.BusRouteId == busRouteId)
            .Where(a => a.DirectionId == null || a.DirectionId == directionId)
            .Where(a => a.EffectiveFrom <= nowInBangkok && (a.EffectiveTo == null || a.EffectiveTo >= nowInBangkok))
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return alert is null
            ? null
            : new TransitAlertInfo(alert.Status, alert.Description, alert.EffectiveFrom, alert.EffectiveTo);
    }
}
