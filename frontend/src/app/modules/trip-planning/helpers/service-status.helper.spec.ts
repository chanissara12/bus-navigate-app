import { TransitAlertStatus } from '../../../shared/models/transit-alert.model';
import { serviceStatusClasses, serviceStatusLabel } from './service-status.helper';

describe('service-status helper', () => {
    describe('serviceStatusLabel', () => {
        it('returns the not-operating-today label when notOperatingToday is true, even with an alert', () => {
            const label = serviceStatusLabel({
                transitAlert: { status: TransitAlertStatus.Delayed, description: null, effectiveFrom: '', effectiveTo: null },
                notOperatingToday: true
            });

            expect(label).toBe('ไม่ให้บริการวันนี้');
        });

        it('returns the normal label when there is no alert', () => {
            const label = serviceStatusLabel({ transitAlert: undefined, notOperatingToday: false });

            expect(label).toBe('ปกติ');
        });

        it.each([
            [TransitAlertStatus.Delayed, 'ล่าช้า'],
            [TransitAlertStatus.TemporarilySuspended, 'หยุดชั่วคราว'],
            [TransitAlertStatus.RouteChanged, 'เปลี่ยนเส้นทาง'],
            [TransitAlertStatus.Cancelled, 'ยกเลิก']
        ])('maps alert status %s to label %s', (status, expectedLabel) => {
            const label = serviceStatusLabel({
                transitAlert: { status, description: null, effectiveFrom: '', effectiveTo: null },
                notOperatingToday: false
            });

            expect(label).toBe(expectedLabel);
        });
    });

    describe('serviceStatusClasses', () => {
        it('returns the slate classes when not operating today', () => {
            expect(serviceStatusClasses({ transitAlert: undefined, notOperatingToday: true })).toBe('bg-slate-200 text-slate-600');
        });

        it('returns the emerald classes when normal', () => {
            expect(serviceStatusClasses({ transitAlert: undefined, notOperatingToday: false })).toBe('bg-emerald-100 text-emerald-800');
        });

        it.each([
            [TransitAlertStatus.Delayed, 'bg-amber-100 text-amber-800'],
            [TransitAlertStatus.TemporarilySuspended, 'bg-orange-100 text-orange-800'],
            [TransitAlertStatus.RouteChanged, 'bg-sky-100 text-sky-800'],
            [TransitAlertStatus.Cancelled, 'bg-red-100 text-red-800']
        ])('maps alert status %s to classes %s', (status, expectedClasses) => {
            const classes = serviceStatusClasses({
                transitAlert: { status, description: null, effectiveFrom: '', effectiveTo: null },
                notOperatingToday: false
            });

            expect(classes).toBe(expectedClasses);
        });
    });
});
