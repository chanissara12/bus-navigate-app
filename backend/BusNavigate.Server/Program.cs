using BusNavigate.Domain.Database;
using BusNavigate.Server.Middlewares;
using BusNavigate.Server.Services;
using BusNavigate.Service.Extensions;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddDbContext<BusNavigateDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("BusNavigate")));

builder.Services.AddGtfsImport();
builder.Services.AddBusStopContext();
builder.Services.AddHostedService<WeeklyDataSyncBackgroundService>();

builder.Services.AddTravelSession();
builder.Services.AddHostedService<TravelSessionStallSweepBackgroundService>();

builder.Services.AddTravelOptionEvaluation();

builder.Services.AddRecovery();

builder.Services.AddServiceStatus();

builder.Services.AddTripPlanning();

// Frontend build-out map (2026-09-24 discovery): the Angular dev server (localhost:4200)
// and this API (localhost:5261/7057) are different origins with nothing else bridging
// them (no dev proxy) — without a CORS policy every request is blocked by the browser
// before it reaches a controller. AllowedOrigins is empty by default (see
// appsettings.Example.json) so a deployment that never sets it stays closed.
var corsAllowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy => policy.WithOrigins(corsAllowedOrigins).AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<DeviceIdentityMiddleware>();

// Same discovery as above: forcing every request onto HTTPS redirects the frontend's
// plain-http dev calls to the HTTPS port, which the browser then blocks anyway
// (untrusted local dev certificate) — skip it in Development, same as the stock
// ASP.NET Core Web API template does.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("Frontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
