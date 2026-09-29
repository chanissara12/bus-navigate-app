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

    // Never throws — for endpoints where a UserId is optional context (e.g. trip-
    // planning search uses it only to look up a UserPreference for ranking; a missing
    // X-Device-Id just means no reordering, not a failed request) (03).
    public static int? GetUserId(this HttpContext context)
    {
        if (context.Items.TryGetValue(DeviceIdentityMiddleware.UserIdItemKey, out var userId) && userId is int id)
        {
            return id;
        }

        return null;
    }
}
