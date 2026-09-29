import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UserPreferenceService } from './user-preference.service';

describe('UserPreferenceService', () => {
    let service: UserPreferenceService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [UserPreferenceService, provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(UserPreferenceService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('requests the saved preference', () => {
        service.get().subscribe();

        const request = httpTesting.expectOne((req) => req.url.endsWith('/user-preferences'));
        expect(request.request.method).toBe('GET');
        request.flush({
            minimizeWalking: true,
            minimizeTransfers: false,
            avoidStreetCrossing: false,
            updatedAt: '2026-09-28T00:00:00Z'
        });
    });

    it('replaces the preference with a single PUT of all three toggles', () => {
        service
            .save({ minimizeWalking: true, minimizeTransfers: true, avoidStreetCrossing: false })
            .subscribe();

        const request = httpTesting.expectOne((req) => req.url.endsWith('/user-preferences'));
        expect(request.request.method).toBe('PUT');
        expect(request.request.body).toEqual({
            minimizeWalking: true,
            minimizeTransfers: true,
            avoidStreetCrossing: false
        });
        request.flush({
            minimizeWalking: true,
            minimizeTransfers: true,
            avoidStreetCrossing: false,
            updatedAt: '2026-09-28T00:00:00Z'
        });
    });

    it('converts HTTP errors into Error values', () => {
        let error: Error | undefined;

        service.get().subscribe({
            error: (err: Error) => error = err
        });

        httpTesting.expectOne((req) => req.url.endsWith('/user-preferences')).flush(
            { message: 'failed' },
            { status: 500, statusText: 'Server Error' }
        );

        expect(error?.message).toBe('failed');
    });
});
