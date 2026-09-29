namespace BusNavigate.Domain.Exceptions;

public class ValidateException : Exception
{
    public List<string> Messages { get; } = [];
    public override string Message => string.Join(", ", Messages);

    public ValidateException() { }
    public ValidateException(string message) => Messages.Add(message);

    public void Add(string message) => Messages.Add(message);

    public void ThrowIfAny()
    {
        if (Messages.Count > 0) throw this;
    }
}
