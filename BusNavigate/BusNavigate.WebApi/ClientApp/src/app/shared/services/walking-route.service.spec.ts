import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { WalkingRouteService } from './walking-route.service';

describe('WalkingRouteService', () => {
    let service: WalkingRouteService;
    let httpTesting: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [WalkingRouteService, provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(WalkingRouteService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpTesting.verify());

    it('requests the foot profile with start/end coordinates and converts lon/lat to lat/lng', () => {
        let result: unknown;
        service.getRoute([13.75, 100.5], [13.76, 100.52]).subscribe((route) => result = route);

        const request = httpTesting.expectOne(
            (req) => req.url.startsWith('https://router.project-osrm.org/route/v1/foot/100.5,13.75;100.52,13.76')
        );
        request.flush({
            routes: [{ distance: 2600, geometry: { coordinates: [[100.5, 13.75], [100.51, 13.755], [100.52, 13.76]] } }]
        });

        expect(result).toEqual([[13.75, 100.5], [13.755, 100.51], [13.76, 100.52]]);
    });

    it('returns undefined when the response has no routes', () => {
        let result: unknown = 'not set';
        service.getRoute([13.75, 100.5], [13.76, 100.52]).subscribe((route) => result = route);

        httpTesting.expectOne(() => true).flush({ routes: [] });

        expect(result).toBeUndefined();
    });

    it('returns undefined instead of throwing on an HTTP error', () => {
        let result: unknown = 'not set';
        service.getRoute([13.75, 100.5], [13.76, 100.52]).subscribe((route) => result = route);

        httpTesting.expectOne(() => true).flush(null, { status: 500, statusText: 'Server Error' });

        expect(result).toBeUndefined();
    });

    it('requests the driving profile when asked for one', () => {
        service.getRoute([13.75, 100.5], [13.76, 100.52], 'driving').subscribe();

        const request = httpTesting.expectOne(
            (req) => req.url.startsWith('https://router.project-osrm.org/route/v1/driving/100.5,13.75;100.52,13.76')
        );
        request.flush({
            routes: [{ distance: 2600, geometry: { coordinates: [[100.5, 13.75], [100.52, 13.76]] } }]
        });
    });

    it('returns undefined when the routed distance is an implausible detour vs. the straight line', () => {
        // Straight-line gap here is ~2.43km; an 8km routed "path" is a >2.5x detour —
        // reproduces a real case seen against live OSRM data near a Bangkok bus stop.
        let result: unknown = 'not set';
        service.getRoute([13.75, 100.5], [13.76, 100.52]).subscribe((route) => result = route);

        httpTesting.expectOne(() => true).flush({
            routes: [{ distance: 8000, geometry: { coordinates: [[100.5, 13.75], [100.52, 13.76]] } }]
        });

        expect(result).toBeUndefined();
    });
});
