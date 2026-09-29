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
            expect(serviceStatusClasses({ transitAlert: undefined, notOperatingToday: true }))
                .toBe('bg-ink-200 text-ink-600 dark:bg-night-500 dark:text-night-100');
        });

        it('returns the neutral ink classes when normal', () => {
            expect(serviceStatusClasses({ transitAlert: undefined, notOperatingToday: false }))
                .toBe('bg-ink-100 text-ink-600 dark:bg-night-500 dark:text-night-100');
        });

        it.each([
            [TransitAlertStatus.Delayed, 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200'],
            [TransitAlertStatus.TemporarilySuspended, 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200'],
            [TransitAlertStatus.RouteChanged, 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'],
            [TransitAlertStatus.Cancelled, 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200']
        ])('maps alert status %s to classes %s', (status, expectedClasses) => {
            const classes = serviceStatusClasses({
                transitAlert: { status, description: null, effectiveFrom: '', effectiveTo: null },
                notOperatingToday: false
            });

            expect(classes).toBe(expectedClasses);
        });
    });
});
