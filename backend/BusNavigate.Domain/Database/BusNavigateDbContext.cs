using BusNavigate.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Domain.Database;

public class BusNavigateDbContext(DbContextOptions<BusNavigateDbContext> options) : DbContext(options)
{
    public DbSet<BusRoute> BusRoutes => Set<BusRoute>();

    public DbSet<Direction> Directions => Set<Direction>();

    public DbSet<RouteStop> RouteStops => Set<RouteStop>();

    public DbSet<BusStop> BusStops => Set<BusStop>();

    public DbSet<Trip> Trips => Set<Trip>();

    public DbSet<TripStopTime> TripStopTimes => Set<TripStopTime>();

    public DbSet<ServiceCalendar> ServiceCalendars => Set<ServiceCalendar>();

    public DbSet<ServiceException> ServiceExceptions => Set<ServiceException>();

    public DbSet<User> Users => Set<User>();

    public DbSet<TravelSession> TravelSessions => Set<TravelSession>();

    public DbSet<Place> Places => Set<Place>();

    public DbSet<TransitAlert> TransitAlerts => Set<TransitAlert>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BusRoute>(entity =>
        {
            entity.HasIndex(e => e.ExternalRouteId).IsUnique();
        });

        modelBuilder.Entity<Direction>(entity =>
        {
            entity.HasIndex(e => e.ExternalDirectionKey).IsUnique();
            entity.HasOne(e => e.BusRoute)
                .WithMany(r => r.Directions)
                .HasForeignKey(e => e.BusRouteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BusStop>(entity =>
        {
            entity.HasIndex(e => e.ExternalStopId).IsUnique();
            entity.Property(e => e.Latitude).HasPrecision(9, 6);
            entity.Property(e => e.Longitude).HasPrecision(9, 6);
        });

        modelBuilder.Entity<RouteStop>(entity =>
        {
            entity.HasIndex(e => new { e.DirectionId, e.BusStopId }).IsUnique();
            entity.HasOne(e => e.Direction)
                .WithMany(d => d.RouteStops)
                .HasForeignKey(e => e.DirectionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.BusStop)
                .WithMany(s => s.RouteStops)
                .HasForeignKey(e => e.BusStopId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ServiceCalendar>(entity =>
        {
            entity.HasIndex(e => e.ExternalServiceId).IsUnique();
        });

        modelBuilder.Entity<ServiceException>(entity =>
        {
            entity.HasIndex(e => new { e.ServiceCalendarId, e.ExceptionDate }).IsUnique();
            entity.HasOne(e => e.ServiceCalendar)
                .WithMany(c => c.ServiceExceptions)
                .HasForeignKey(e => e.ServiceCalendarId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Trip>(entity =>
        {
            entity.HasIndex(e => e.ExternalTripId).IsUnique();
            entity.HasOne(e => e.Direction)
                .WithMany(d => d.Trips)
                .HasForeignKey(e => e.DirectionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ServiceCalendar)
                .WithMany(c => c.Trips)
                .HasForeignKey(e => e.ServiceCalendarId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TripStopTime>(entity =>
        {
            entity.HasIndex(e => new { e.TripId, e.RouteStopId }).IsUnique();
            entity.HasOne(e => e.Trip)
                .WithMany(t => t.TripStopTimes)
                .HasForeignKey(e => e.TripId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.RouteStop)
                .WithMany(rs => rs.TripStopTimes)
                .HasForeignKey(e => e.RouteStopId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.ExternalDeviceId).IsUnique();
        });

        modelBuilder.Entity<TravelSession>(entity =>
        {
            entity.HasOne(e => e.User)
                .WithMany(u => u.TravelSessions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Direction)
                .WithMany()
                .HasForeignKey(e => e.DirectionId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.BoardingStop)
                .WithMany()
                .HasForeignKey(e => e.BoardingStopId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.AlightingStop)
                .WithMany()
                .HasForeignKey(e => e.AlightingStopId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Place>(entity =>
        {
            entity.HasIndex(e => e.ExternalId).IsUnique();
            entity.Property(e => e.Latitude).HasPrecision(9, 6);
            entity.Property(e => e.Longitude).HasPrecision(9, 6);
        });

        modelBuilder.Entity<TransitAlert>(entity =>
        {
            entity.HasIndex(e => new { e.BusRouteId, e.DirectionId });
            entity.HasOne(e => e.BusRoute)
                .WithMany()
                .HasForeignKey(e => e.BusRouteId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Direction)
                .WithMany()
                .HasForeignKey(e => e.DirectionId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
