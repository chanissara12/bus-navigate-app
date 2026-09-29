using BusNavigate.Domain.Constants;
using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using BusNavigate.Domain.Interfaces.GtfsImport;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using BusStopEntity = BusNavigate.Domain.Entities.BusStop;

namespace BusNavigate.Service.Implements.GtfsImport;

public class GtfsImportService : IGtfsImportService
{
    private readonly BusNavigateDbContext _dbContext;
    private readonly IGtfsFeedFetcher _feedFetcher;
    private readonly ILogger<GtfsImportService> _logger;

    public GtfsImportService(
        BusNavigateDbContext dbContext, IGtfsFeedFetcher feedFetcher, ILogger<GtfsImportService> logger)
    {
        _dbContext = dbContext;
        _feedFetcher = feedFetcher;
        _logger = logger;
    }

    public async Task ImportAsync(CancellationToken cancellationToken = default)
    {
        var feed = await _feedFetcher.FetchLatestAsync(cancellationToken);

        var agencies = GtfsParser.ParseAgencies(feed.Agency);
        var routes = GtfsParser.ParseRoutes(feed.Routes);
        var trips = GtfsParser.ParseTrips(feed.Trips);
        var stops = GtfsParser.ParseStops(feed.Stops);
        var stopTimes = GtfsParser.ParseStopTimes(feed.StopTimes);
        var calendars = GtfsParser.ParseCalendars(feed.Calendar);
        var calendarDates = GtfsParser.ParseCalendarDates(feed.CalendarDates);

        var importedAt = DateTime.UtcNow;

        // The in-memory provider (used in unit tests) doesn't support transactions —
        // only wrap the import in one against a real relational database.
        var transaction = _dbContext.Database.IsRelational()
            ? await _dbContext.Database.BeginTransactionAsync(cancellationToken)
            : null;
        await using var _ = transaction;

        var duplicateAgencies = agencies
            .GroupBy(a => a.AgencyId)
            .Where(g => g.Count() > 1)
            .ToList();

        foreach (var duplicate in duplicateAgencies)
        {
            var agencyNames = duplicate
                .Select(a => a.AgencyName)
                .Distinct(StringComparer.Ordinal)
                .ToList();

            _logger.LogWarning(
                "GTFS agency.txt contains duplicate rows for agency_id '{AgencyId}'. " +
                "Using combined agency names: '{AgencyNames}'.",
                duplicate.Key,
                string.Join(" / ", agencyNames));
        }

        var agencyNameById = agencies
            .GroupBy(a => a.AgencyId)
            .ToDictionary(
                g => g.Key,
                g => string.Join(
                    " / ",
                    g.Select(a => a.AgencyName)
                        .Distinct(StringComparer.Ordinal)),
                StringComparer.Ordinal);

        var serviceCalendarByExternalId = await UpsertServiceCalendarsAsync(calendars, cancellationToken);
        await UpsertServiceExceptionsAsync(calendarDates, serviceCalendarByExternalId, cancellationToken);

        var busRouteByExternalId = await UpsertBusRoutesAsync(routes, agencyNameById, importedAt, cancellationToken);
        var directionByExternalKey = await UpsertDirectionsAsync(trips, busRouteByExternalId, cancellationToken);
        var busStopByExternalId = await UpsertBusStopsAsync(stops, cancellationToken);

        var directionIdByTripId = trips
            .Where(t => directionByExternalKey.ContainsKey($"{t.RouteId}-{t.DirectionId}"))
            .ToDictionary(t => t.TripId, t => directionByExternalKey[$"{t.RouteId}-{t.DirectionId}"].Id);

        var routeStopByDirectionAndStop = await UpsertRouteStopsAsync(
            stopTimes, directionIdByTripId, busStopByExternalId, cancellationToken);

        var tripByExternalId = await UpsertTripsAsync(
            trips, directionByExternalKey, serviceCalendarByExternalId, cancellationToken);

        await UpsertTripStopTimesAsync(
            stopTimes, tripByExternalId, directionIdByTripId, busStopByExternalId,
            routeStopByDirectionAndStop, cancellationToken);

        if (transaction is not null)
        {
            await transaction.CommitAsync(cancellationToken);
        }

        _logger.LogInformation(
            "GTFS import complete: {RouteCount} routes, {DirectionCount} directions, {StopCount} stops, {TripCount} trips",
            busRouteByExternalId.Count, directionByExternalKey.Count, busStopByExternalId.Count, tripByExternalId.Count);
    }

    private async Task<Dictionary<string, ServiceCalendar>> UpsertServiceCalendarsAsync(
        List<GtfsCalendar> calendars, CancellationToken cancellationToken)
    {
        var existing = await _dbContext.ServiceCalendars.ToDictionaryAsync(c => c.ExternalServiceId, cancellationToken);

        foreach (var calendar in calendars)
        {
            if (!existing.TryGetValue(calendar.ServiceId, out var entity))
            {
                entity = new ServiceCalendar { ExternalServiceId = calendar.ServiceId };
                _dbContext.ServiceCalendars.Add(entity);
                existing[calendar.ServiceId] = entity;
            }

            entity.Monday = calendar.Monday;
            entity.Tuesday = calendar.Tuesday;
            entity.Wednesday = calendar.Wednesday;
            entity.Thursday = calendar.Thursday;
            entity.Friday = calendar.Friday;
            entity.Saturday = calendar.Saturday;
            entity.Sunday = calendar.Sunday;
            entity.StartDate = calendar.StartDate;
            entity.EndDate = calendar.EndDate;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    private async Task UpsertServiceExceptionsAsync(
        List<GtfsCalendarDate> calendarDates,
        Dictionary<string, ServiceCalendar> serviceCalendarByExternalId,
        CancellationToken cancellationToken)
    {
        var existing = await _dbContext.ServiceExceptions
            .ToDictionaryAsync(e => (e.ServiceCalendarId, e.ExceptionDate), cancellationToken);

        foreach (var calendarDate in calendarDates)
        {
            if (!serviceCalendarByExternalId.TryGetValue(calendarDate.ServiceId, out var calendar))
            {
                _logger.LogWarning(
                    "Skipping calendar_dates row: unknown service_id {ServiceId}", calendarDate.ServiceId);
                continue;
            }

            var exceptionType = calendarDate.ExceptionType switch
            {
                1 => ServiceExceptionType.Added,
                2 => ServiceExceptionType.Removed,
                _ => (ServiceExceptionType?)null,
            };

            if (exceptionType is null)
            {
                _logger.LogWarning(
                    "Skipping calendar_dates row: unknown exception_type {ExceptionType}", calendarDate.ExceptionType);
                continue;
            }

            var key = (calendar.Id, calendarDate.Date);
            if (!existing.TryGetValue(key, out var entity))
            {
                entity = new ServiceException { ServiceCalendarId = calendar.Id, ExceptionDate = calendarDate.Date };
                _dbContext.ServiceExceptions.Add(entity);
                existing[key] = entity;
            }

            entity.ExceptionType = exceptionType.Value;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<Dictionary<string, BusRoute>> UpsertBusRoutesAsync(
        List<GtfsRoute> routes,
        Dictionary<string, string> agencyNameById,
        DateTime importedAt,
        CancellationToken cancellationToken)
    {
        var existing = await _dbContext.BusRoutes.ToDictionaryAsync(r => r.ExternalRouteId, cancellationToken);

        foreach (var route in routes)
        {
            if (!existing.TryGetValue(route.RouteId, out var entity))
            {
                entity = new BusRoute { ExternalRouteId = route.RouteId };
                _dbContext.BusRoutes.Add(entity);
                existing[route.RouteId] = entity;
            }

            entity.ShortName = route.ShortName;
            entity.LongName = route.LongName;
            entity.AgencyName = agencyNameById.GetValueOrDefault(route.AgencyId, string.Empty);
            entity.DataSource = DataSources.NamtangGtfs;
            entity.ImportedAt = importedAt;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    // Direction is derived, not a native GTFS entity: one row per (route_id,
    // direction_id), headsign = the most common trip_headsign among that group's trips.
    private async Task<Dictionary<string, Direction>> UpsertDirectionsAsync(
        List<GtfsTrip> trips,
        Dictionary<string, BusRoute> busRouteByExternalId,
        CancellationToken cancellationToken)
    {
        var existing = await _dbContext.Directions.ToDictionaryAsync(d => d.ExternalDirectionKey, cancellationToken);

        var groups = trips
            .Where(t => busRouteByExternalId.ContainsKey(t.RouteId))
            .GroupBy(t => (t.RouteId, t.DirectionId));

        foreach (var group in groups)
        {
            var externalKey = $"{group.Key.RouteId}-{group.Key.DirectionId}";
            var mostCommonHeadsign = group
                .GroupBy(t => t.TripHeadsign)
                .OrderByDescending(g => g.Count())
                .First()
                .Key;

            if (!existing.TryGetValue(externalKey, out var entity))
            {
                entity = new Direction { ExternalDirectionKey = externalKey };
                _dbContext.Directions.Add(entity);
                existing[externalKey] = entity;
            }

            entity.BusRouteId = busRouteByExternalId[group.Key.RouteId].Id;
            entity.DirectionIndex = group.Key.DirectionId;
            entity.Headsign = mostCommonHeadsign;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    private async Task<Dictionary<string, BusStopEntity>> UpsertBusStopsAsync(
        List<GtfsStop> stops, CancellationToken cancellationToken)
    {
        var existing = await _dbContext.BusStops.ToDictionaryAsync(s => s.ExternalStopId, cancellationToken);

        foreach (var stop in stops)
        {
            if (!existing.TryGetValue(stop.StopId, out var entity))
            {
                entity = new BusStopEntity { ExternalStopId = stop.StopId };
                _dbContext.BusStops.Add(entity);
                existing[stop.StopId] = entity;
            }

            entity.NameTh = stop.NameTh;
            entity.NameEn = stop.NameEn;
            entity.StopCode = stop.StopCode;
            entity.Latitude = stop.Latitude;
            entity.Longitude = stop.Longitude;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    // RouteStop is the canonical, superset ordered stop list for a Direction — the
    // union of every stop any trip in that Direction visits. Order is derived from the
    // earliest stop_sequence at which each stop appears across the Direction's trips,
    // so a short-turn trip (fewer stops) never reorders the canonical list.
    private async Task<Dictionary<(int DirectionId, int BusStopId), RouteStop>> UpsertRouteStopsAsync(
        List<GtfsStopTime> stopTimes,
        Dictionary<string, int> directionIdByTripId,
        Dictionary<string, BusStopEntity> busStopByExternalId,
        CancellationToken cancellationToken)
    {
        var existing = await _dbContext.RouteStops
            .ToDictionaryAsync(rs => (rs.DirectionId, rs.BusStopId), cancellationToken);

        var minSequenceByDirectionAndStop = new Dictionary<(int DirectionId, int BusStopId), int>();

        foreach (var stopTime in stopTimes)
        {
            if (!directionIdByTripId.TryGetValue(stopTime.TripId, out var directionId) ||
                !busStopByExternalId.TryGetValue(stopTime.StopId, out var busStop))
            {
                continue;
            }

            var key = (directionId, busStop.Id);
            if (!minSequenceByDirectionAndStop.TryGetValue(key, out var currentMin) ||
                stopTime.StopSequence < currentMin)
            {
                minSequenceByDirectionAndStop[key] = stopTime.StopSequence;
            }
        }

        foreach (var directionGroup in minSequenceByDirectionAndStop
            .GroupBy(kvp => kvp.Key.DirectionId)
            .Select(g => g.OrderBy(kvp => kvp.Value).ToList()))
        {
            for (var i = 0; i < directionGroup.Count; i++)
            {
                var key = directionGroup[i].Key;
                if (!existing.TryGetValue(key, out var entity))
                {
                    entity = new RouteStop { DirectionId = key.DirectionId, BusStopId = key.BusStopId };
                    _dbContext.RouteStops.Add(entity);
                    existing[key] = entity;
                }

                entity.SequenceNumber = i + 1;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    private async Task<Dictionary<string, Trip>> UpsertTripsAsync(
        List<GtfsTrip> trips,
        Dictionary<string, Direction> directionByExternalKey,
        Dictionary<string, ServiceCalendar> serviceCalendarByExternalId,
        CancellationToken cancellationToken)
    {
        var existing = await _dbContext.Trips.ToDictionaryAsync(t => t.ExternalTripId, cancellationToken);

        foreach (var trip in trips)
        {
            var directionKey = $"{trip.RouteId}-{trip.DirectionId}";
            if (!directionByExternalKey.TryGetValue(directionKey, out var direction) ||
                !serviceCalendarByExternalId.TryGetValue(trip.ServiceId, out var serviceCalendar))
            {
                _logger.LogWarning("Skipping trip {TripId}: missing direction or service calendar", trip.TripId);
                continue;
            }

            if (!existing.TryGetValue(trip.TripId, out var entity))
            {
                entity = new Trip { ExternalTripId = trip.TripId };
                _dbContext.Trips.Add(entity);
                existing[trip.TripId] = entity;
            }

            entity.DirectionId = direction.Id;
            entity.ServiceCalendarId = serviceCalendar.Id;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    private async Task UpsertTripStopTimesAsync(
        List<GtfsStopTime> stopTimes,
        Dictionary<string, Trip> tripByExternalId,
        Dictionary<string, int> directionIdByTripId,
        Dictionary<string, BusStopEntity> busStopByExternalId,
        Dictionary<(int DirectionId, int BusStopId), RouteStop> routeStopByDirectionAndStop,
        CancellationToken cancellationToken)
    {
        var existing = await _dbContext.TripStopTimes
            .ToDictionaryAsync(t => (t.TripId, t.RouteStopId), cancellationToken);

        foreach (var stopTime in stopTimes)
        {
            if (!tripByExternalId.TryGetValue(stopTime.TripId, out var trip) ||
                !directionIdByTripId.TryGetValue(stopTime.TripId, out var directionId) ||
                !busStopByExternalId.TryGetValue(stopTime.StopId, out var busStop) ||
                !routeStopByDirectionAndStop.TryGetValue((directionId, busStop.Id), out var routeStop))
            {
                continue;
            }

            var key = (trip.Id, routeStop.Id);
            if (!existing.TryGetValue(key, out var entity))
            {
                entity = new TripStopTime { TripId = trip.Id, RouteStopId = routeStop.Id };
                _dbContext.TripStopTimes.Add(entity);
                existing[key] = entity;
            }

            entity.ArrivalTime = stopTime.ArrivalTime;
            entity.DepartureTime = stopTime.DepartureTime;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
