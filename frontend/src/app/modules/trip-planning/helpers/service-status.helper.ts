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
        return 'bg-slate-200 text-slate-600';
    }
    if (!status.transitAlert) {
        return 'bg-emerald-100 text-emerald-800';
    }

    switch (status.transitAlert.status) {
        case TransitAlertStatus.Delayed:
            return 'bg-amber-100 text-amber-800';
        case TransitAlertStatus.TemporarilySuspended:
            return 'bg-orange-100 text-orange-800';
        case TransitAlertStatus.RouteChanged:
            return 'bg-sky-100 text-sky-800';
        case TransitAlertStatus.Cancelled:
            return 'bg-red-100 text-red-800';
    }
}
