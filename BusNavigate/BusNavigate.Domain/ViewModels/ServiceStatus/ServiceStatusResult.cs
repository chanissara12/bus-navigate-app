namespace BusNavigate.Domain.ViewModels.ServiceStatus;

// Shape matches T09's GET /routes/{routeId}/status response exactly:
// { transitAlert: TransitAlert | null, notOperatingToday: bool } — the two are kept as
// separate fields per T07, never merged. TransitAlert == null means no active alert,
// i.e. the T07 default: Normal, DataConfidence: Scheduled (not carried as an explicit
// field here since T09's locked contract doesn't include one).
public record ServiceStatusResult(TransitAlertInfo? TransitAlert, bool NotOperatingToday);
