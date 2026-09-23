namespace BusNavigate.Server.Middlewares;

// T09's locked error shape, matching root CLAUDE.md's frontend catchError convention
// (err.error?.message).
public record ErrorResponse(string Message, string? Code = null, object? Details = null);
