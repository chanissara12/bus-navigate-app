using BusNavigate.Domain.Interfaces.BusStop;
using BusNavigate.Domain.Interfaces.GtfsImport;
using BusNavigate.Domain.Interfaces.PreferenceRanking;
using BusNavigate.Domain.Interfaces.Recovery;
using BusNavigate.Domain.Interfaces.ServiceStatus;
using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using BusNavigate.Domain.Interfaces.TravelSession;
using BusNavigate.Domain.Interfaces.TripPlanning;
using BusNavigate.Domain.Interfaces.UserPreference;
using BusNavigate.Service.Implements.BusStop;
using BusNavigate.Service.Implements.GtfsImport;
using BusNavigate.Service.Implements.PreferenceRanking;
using BusNavigate.Service.Implements.Recovery;
using BusNavigate.Service.Implements.ServiceStatus;
using BusNavigate.Service.Implements.TravelOptionEvaluation;
using BusNavigate.Service.Implements.TravelSession;
using BusNavigate.Service.Implements.TripPlanning;
using BusNavigate.Service.Implements.UserPreference;
using Microsoft.Extensions.DependencyInjection;

namespace BusNavigate.Service.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddGtfsImport(this IServiceCollection services)
    {
        services.AddHttpClient<IGtfsFeedFetcher, GtfsFeedFetcher>();
        services.AddScoped<IGtfsImportService, GtfsImportService>();
        services.AddScoped<IRouteShapeImportService, RouteShapeImportService>();
        services.AddScoped<IRouteShapeService, RouteShapeService>();

        return services;
    }

    public static IServiceCollection AddTravelSession(this IServiceCollection services)
    {
        services.AddScoped<ITravelSessionService, TravelSessionService>();

        return services;
    }

    public static IServiceCollection AddTravelOptionEvaluation(this IServiceCollection services)
    {
        services.AddScoped<IReachabilityService, ReachabilityService>();
        services.AddScoped<ITravelOptionEvaluationService, TravelOptionEvaluationService>();

        return services;
    }

    public static IServiceCollection AddRecovery(this IServiceCollection services)
    {
        services.AddScoped<IRecoveryService, RecoveryService>();

        return services;
    }

    public static IServiceCollection AddServiceStatus(this IServiceCollection services)
    {
        services.AddScoped<IServiceStatusService, ServiceStatusService>();

        return services;
    }

    public static IServiceCollection AddBusStopContext(this IServiceCollection services)
    {
        services.AddHttpClient<IStopLandmarkFetcher, StopLandmarkFetcher>(client =>
        {
            client.DefaultRequestHeaders.UserAgent.ParseAdd("BusNavigate/1.0 (landmark sync)");
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        });
        services.AddScoped<IStopLandmarkSyncService, StopLandmarkSyncService>();
        services.AddScoped<IBusStopContextService, BusStopContextService>();
        services.AddScoped<INearbyBusStopSearchService, NearbyBusStopSearchService>();

        return services;
    }

    public static IServiceCollection AddTripPlanning(this IServiceCollection services)
    {
        services.AddScoped<IPlaceSearchService, PlaceSearchService>();
        services.AddScoped<ITravelOptionSearchService, TravelOptionSearchService>();

        return services;
    }

    public static IServiceCollection AddUserPreference(this IServiceCollection services)
    {
        services.AddScoped<IUserPreferenceService, UserPreferenceService>();

        return services;
    }

    public static IServiceCollection AddPreferenceRanking(this IServiceCollection services)
    {
        services.AddScoped<IPreferenceRankingService, PreferenceRankingService>();

        return services;
    }
}
