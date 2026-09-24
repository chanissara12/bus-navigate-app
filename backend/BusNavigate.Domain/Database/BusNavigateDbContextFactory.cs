using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace BusNavigate.Domain.Database;

// Used by `dotnet ef migrations add` at design time. Never connects to this
// placeholder database — only needed for EF to build the model.
public class BusNavigateDbContextFactory : IDesignTimeDbContextFactory<BusNavigateDbContext>
{
    public BusNavigateDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<BusNavigateDbContext>();
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "BusNavigate.Server");
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";

        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .Build();

        var connectionString = configuration.GetConnectionString("BusNavigate")
            ?? throw new InvalidOperationException("Connection string 'BusNavigate' was not found.");

        optionsBuilder.UseNpgsql(connectionString);

        return new BusNavigateDbContext(optionsBuilder.Options);
    }
}
