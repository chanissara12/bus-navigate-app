using BusNavigate.Domain.Interfaces.GtfsImport;
using BusNavigate.Service.Implements.GtfsImport;
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
}
