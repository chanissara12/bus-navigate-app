using BusNavigate.Domain.Exceptions;
using BusNavigate.Server.Middlewares;

namespace BusNavigate.Server.Extensions;

public static class HttpContextExtensions
{
    // Throws if X-Device-Id was missing — only endpoints that actually need a UserId
    // call this (see DeviceIdentityMiddleware).
    public static int GetRequiredUserId(this HttpContext context)
    {
        if (context.Items.TryGetValue(DeviceIdentityMiddleware.UserIdItemKey, out var userId) && userId is int id)
        {
            return id;
        }

        throw new ValidateException($"{DeviceIdentityMiddleware.DeviceIdHeaderName} header is required.");
    }
}
