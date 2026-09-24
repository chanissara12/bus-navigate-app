// Mirrors backend/BusNavigate.Domain/Entities/TransitAlertStatus.cs — numeric values
// matter, System.Text.Json serializes the enum as a number, not a string (see
// travel-session-state.model.ts for the same convention).
export enum TransitAlertStatus {
    Delayed = 0,
    TemporarilySuspended = 1,
    RouteChanged = 2,
    Cancelled = 3
}

export interface TransitAlertInfo {
    status: TransitAlertStatus;
    description: string | null;
    effectiveFrom: string;
    effectiveTo: string | null;
}

export interface ServiceStatusResult {
    transitAlert: TransitAlertInfo | undefined;
    notOperatingToday: boolean;
}
