import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BusStopsService } from './bus-stops.service';

describe('BusStopsService', () => {
    let service: BusStopsService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [BusStopsService, provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(BusStopsService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('requests nearby stops with latitude, longitude and radius', () => {
        service.findNearby(13.75, 100.5, 1000).subscribe();

        const request = httpTesting.expectOne(
            (req) => req.url.includes('/bus-stops/nearby')
                && req.params.get('lat') === '13.75'
                && req.params.get('lng') === '100.5'
                && req.params.get('radius') === '1000'
        );

        expect(request.request.method).toBe('GET');
        request.flush([]);
    });

    it('requests stop context by id', () => {
        service.getContext(42).subscribe();

        const request = httpTesting.expectOne((req) => req.url.endsWith('/bus-stops/42'));
        expect(request.request.method).toBe('GET');
        request.flush({
            busStopId: 42,
            nameTh: 'ป้าย',
            nameEn: 'Stop',
            stopCode: null,
            latitude: 13.75,
            longitude: 100.5,
            landmarks: []
        });
    });

    it('converts HTTP errors into Error values', () => {
        let error: Error | undefined;

        service.getContext(42).subscribe({
            error: (err: Error) => error = err
        });

        httpTesting.expectOne((req) => req.url.endsWith('/bus-stops/42')).flush(
            { message: 'failed' },
            { status: 500, statusText: 'Server Error' }
        );

        expect(error?.message).toBe('failed');
    });
});
