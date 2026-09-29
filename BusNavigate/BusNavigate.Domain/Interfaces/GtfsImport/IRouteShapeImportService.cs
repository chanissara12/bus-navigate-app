namespace BusNavigate.Domain.Interfaces.GtfsImport;

public interface IRouteShapeImportService
{
    Task ImportAsync(CancellationToken cancellationToken = default);
}
