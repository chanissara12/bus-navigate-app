export type TransitAlertStatus = 'Delayed' | 'TemporarilySuspended' | 'RouteChanged' | 'Cancelled';

export interface TransitAlertInfo {
    status: TransitAlertStatus;
    description: string | undefined;
    effectiveFrom: string;
    effectiveTo: string | undefined;
}

export interface ServiceStatusResult {
    transitAlert: TransitAlertInfo | undefined;
    notOperatingToday: boolean;
}
