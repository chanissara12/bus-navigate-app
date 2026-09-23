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

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<DeviceIdentityMiddleware>();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
