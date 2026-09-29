import { ServiceStatusResult, TransitAlertStatus } from '../../../shared/models/transit-alert.model';

// Note: NotOperatingToday takes priority over any TransitAlert — the real service
// contract keeps the two fields independent (backend/.../ServiceStatusResult.cs), but
// "not running today" is more severe than any status while the route is running.
export function serviceStatusLabel(status: ServiceStatusResult): string {
    if (status.notOperatingToday) {
        return 'ไม่ให้บริการวันนี้';
    }
    if (!status.transitAlert) {
        return 'ปกติ';
    }

    switch (status.transitAlert.status) {
        case TransitAlertStatus.Delayed:
            return 'ล่าช้า';
        case TransitAlertStatus.TemporarilySuspended:
            return 'หยุดชั่วคราว';
        case TransitAlertStatus.RouteChanged:
            return 'เปลี่ยนเส้นทาง';
        case TransitAlertStatus.Cancelled:
            return 'ยกเลิก';
    }
}

export function serviceStatusClasses(status: ServiceStatusResult): string {
    if (status.notOperatingToday) {
        return 'bg-ink-200 text-ink-600';
    }
    if (!status.transitAlert) {
        return 'bg-success-100 text-success-800';
    }

    switch (status.transitAlert.status) {
        case TransitAlertStatus.Delayed:
            return 'bg-warning-100 text-warning-800';
        case TransitAlertStatus.TemporarilySuspended:
            return 'bg-orange-100 text-orange-800';
        case TransitAlertStatus.RouteChanged:
            return 'bg-accent-100 text-accent-800';
        case TransitAlertStatus.Cancelled:
            return 'bg-danger-100 text-danger-800';
    }
}
