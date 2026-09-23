using BusNavigate.Domain.Interfaces.BusStop;
using BusNavigate.Domain.Interfaces.GtfsImport;
using BusNavigate.Domain.Interfaces.Recovery;
using BusNavigate.Domain.Interfaces.ServiceStatus;
using BusNavigate.Domain.Interfaces.TravelOptionEvaluation;
using BusNavigate.Domain.Interfaces.TravelSession;
using BusNavigate.Service.Implements.BusStop;
using BusNavigate.Service.Implements.GtfsImport;
using BusNavigate.Service.Implements.Recovery;
using BusNavigate.Service.Implements.ServiceStatus;
using BusNavigate.Service.Implements.TravelOptionEvaluation;
using BusNavigate.Service.Implements.TravelSession;
using Microsoft.Extensions.DependencyInjection;

namespace BusNavigate.Service.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddGtfsImport(this IServiceCollection services)
    {
        services.AddHttpClient<IGtfsFeedFetcher, GtfsFeedFetcher>();
        services.AddScoped<IGtfsImportService, GtfsImportService>();

        return services;
    }

    public static IServiceCollection AddTravelSession(this IServiceCollection services)
    {
        services.AddScoped<ITravelSessionService, TravelSessionService>();

        return services;
    }

    public static IServiceCollection AddTravelOptionEvaluation(this IServiceCollection services)
    {
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
        services.AddHttpClient<IStopLandmarkFetcher, StopLandmarkFetcher>();
        services.AddScoped<IStopLandmarkSyncService, StopLandmarkSyncService>();
        services.AddScoped<IBusStopContextService, BusStopContextService>();

        return services;
    }
}
