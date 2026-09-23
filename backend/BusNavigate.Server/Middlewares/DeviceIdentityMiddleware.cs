using BusNavigate.Domain.Database;
using BusNavigate.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BusNavigate.Server.Middlewares;

// Anonymous/device-scoped identity (T09): reads X-Device-Id, lazily upserts a User
// row on first sight, and makes the resolved UserId available to controllers via
// HttpContextExtensions.GetUserId(). Doesn't hard-fail requests missing the header —
// only endpoints that actually need a UserId (e.g. creating a TravelSession) enforce
// its presence themselves, so read-only endpoints (place search, service status)
// don't require a device identity that they never use.
public class DeviceIdentityMiddleware
{
    public const string DeviceIdHeaderName = "X-Device-Id";
    public const string UserIdItemKey = "UserId";

    private readonly RequestDelegate _next;

    public DeviceIdentityMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, BusNavigateDbContext dbContext)
    {
        var deviceId = context.Request.Headers[DeviceIdHeaderName].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(deviceId))
        {
            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.ExternalDeviceId == deviceId);
            if (user is null)
            {
                user = new User { ExternalDeviceId = deviceId, CreatedAt = DateTime.UtcNow };
                dbContext.Users.Add(user);
                await dbContext.SaveChangesAsync();
            }

            context.Items[UserIdItemKey] = user.Id;
        }

        await _next(context);
    }
}
