using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace BusNavigate.Domain.Database;

// Used by `dotnet ef migrations add` at design time. Never connects to this
// placeholder database — only needed for EF to build the model.
public class BusNavigateDbContextFactory : IDesignTimeDbContextFactory<BusNavigateDbContext>
{
    public BusNavigateDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<BusNavigateDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Database=busnavigate_design;Username=design;Password=design");

        return new BusNavigateDbContext(optionsBuilder.Options);
    }
}
