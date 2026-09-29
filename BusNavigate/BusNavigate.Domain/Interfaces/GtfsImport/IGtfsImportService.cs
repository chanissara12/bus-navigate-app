namespace BusNavigate.Domain.Interfaces.GtfsImport;

public interface IGtfsImportService
{
    Task ImportAsync(CancellationToken cancellationToken = default);
}
