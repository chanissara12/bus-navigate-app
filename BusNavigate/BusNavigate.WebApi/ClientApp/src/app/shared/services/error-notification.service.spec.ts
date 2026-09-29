import { TestBed } from '@angular/core/testing';

import { ErrorNotificationService } from './error-notification.service';

describe('ErrorNotificationService', () => {
    let service: ErrorNotificationService;

    beforeEach(() => {
        service = TestBed.inject(ErrorNotificationService);
    });

    it('emits a notified message on errors$', (done) => {
        service.errors$.subscribe((message) => {
            expect(message).toBe('Failed to load route status');
            done();
        });

        service.notify('Failed to load route status');
    });

    it('emits each notification to every subscriber in order', () => {
        const received: string[] = [];
        service.errors$.subscribe((message) => received.push(message));

        service.notify('first error');
        service.notify('second error');

        expect(received).toEqual(['first error', 'second error']);
    });

    it('does not emit anything to a subscriber that joins after notify was called', () => {
        service.notify('missed error');

        const received: string[] = [];
        service.errors$.subscribe((message) => received.push(message));

        expect(received).toEqual([]);
    });
});
