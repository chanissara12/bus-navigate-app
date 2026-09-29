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
        it('returns the ink classes when not operating today', () => {
            expect(serviceStatusClasses({ transitAlert: undefined, notOperatingToday: true })).toBe('bg-ink-200 text-ink-600');
        });

        it('returns the success classes when normal', () => {
            expect(serviceStatusClasses({ transitAlert: undefined, notOperatingToday: false })).toBe('bg-success-100 text-success-800');
        });

        it.each([
            [TransitAlertStatus.Delayed, 'bg-warning-100 text-warning-800'],
            [TransitAlertStatus.TemporarilySuspended, 'bg-orange-100 text-orange-800'],
            [TransitAlertStatus.RouteChanged, 'bg-accent-100 text-accent-800'],
            [TransitAlertStatus.Cancelled, 'bg-danger-100 text-danger-800']
        ])('maps alert status %s to classes %s', (status, expectedClasses) => {
            const classes = serviceStatusClasses({
                transitAlert: { status, description: null, effectiveFrom: '', effectiveTo: null },
                notOperatingToday: false
            });

            expect(classes).toBe(expectedClasses);
        });
    });
});
