using BusNavigate.Domain.Interfaces.GtfsImport;
using BusNavigate.Domain.Interfaces.TravelSession;
using BusNavigate.Service.Implements.GtfsImport;
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
}
