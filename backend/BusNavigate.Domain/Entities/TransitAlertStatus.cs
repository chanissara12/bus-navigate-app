namespace BusNavigate.Domain.Entities;

// Normal and Unknown are deliberately absent — per T07's resolution, "no TransitAlert
// record" already means Normal (DataConfidence: Scheduled) by default; there's no
// stored row for the "nothing's wrong" case. NotOperatingToday is a separate computed
// fact from ServiceCalendar/ServiceException, never a TransitAlert status.
public enum TransitAlertStatus
{
    Delayed,
    TemporarilySuspended,
    RouteChanged,
    Cancelled,
}
