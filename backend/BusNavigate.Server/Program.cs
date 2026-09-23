using BusNavigate.Domain.Database;
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
builder.Services.AddHostedService<GtfsImportBackgroundService>();

builder.Services.AddTravelSession();
builder.Services.AddHostedService<TravelSessionStallSweepBackgroundService>();

builder.Services.AddTravelOptionEvaluation();

builder.Services.AddRecovery();

builder.Services.AddServiceStatus();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
