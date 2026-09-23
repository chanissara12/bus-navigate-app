using BusNavigate.Domain.Exceptions;

namespace BusNavigate.Server.Middlewares;

// T09: all endpoints share this error shape via one middleware, rather than each
// controller catching ValidateException itself.
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidateException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new ErrorResponse(ex.Message));
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Never expose stack traces or internal error details in API responses
            // (root CLAUDE.md security rule) — log the real exception, return a
            // generic message.
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new ErrorResponse("An unexpected error occurred."));
        }
    }
}
