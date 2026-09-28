import { TestBed } from '@angular/core/testing';

import { BusStopContextResult, StopLandmark } from '../../../modules/bus-stop/models/bus-stop.model';
import { RouteMapCardComponent } from './route-map-card.component';

type LatLngTuple = [number, number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrivateApi = any;

function landmark(overrides: Partial<StopLandmark>): StopLandmark {
    return {
        landmarkType: 0,
        nameTh: '',
        nameEn: '',
        description: null,
        distanceMeters: 0,
        latitude: 0,
        longitude: 0,
        ...overrides
    };
}

function stopWithLandmarks(landmarks: StopLandmark[]): BusStopContextResult {
    return {
        busStopId: 1,
        nameTh: 'ป้ายทดสอบ',
        nameEn: 'Test stop',
        stopCode: null,
        latitude: 13.69,
        longitude: 100.501,
        landmarks
    };
}

describe('RouteMapCardComponent calculation logic', () => {
    let component: PrivateApi;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [RouteMapCardComponent] });
        // Never call fixture.detectChanges() here: ngAfterViewInit() would create a
        // real Leaflet map against the #mapHost div, which this suite doesn't need
        // since it only exercises the component's pure geometry/calculation methods.
        component = TestBed.createComponent(RouteMapCardComponent).componentInstance;
    });

    describe('distanceBetweenKm', () => {
        it('returns 0 for identical points', () => {
            const point: LatLngTuple = [13.69, 100.5];

            expect(component.distanceBetweenKm(point, point)).toBe(0);
        });

        it('matches the known ~111.19km for one degree of latitude', () => {
            const distance = component.distanceBetweenKm([0, 0], [1, 0]);

            expect(distance).toBeCloseTo(111.19, 1);
        });
    });

    describe('projectPointOntoSegment', () => {
        const start: LatLngTuple = [13.69, 100.5];
        const end: LatLngTuple = [13.69, 100.501];

        it('returns 0 for a point at the start', () => {
            expect(component.projectPointOntoSegment(start, end, start)).toBeCloseTo(0, 5);
        });

        it('returns 1 for a point at the end', () => {
            expect(component.projectPointOntoSegment(start, end, end)).toBeCloseTo(1, 5);
        });

        it('returns 0.5 for the midpoint', () => {
            const midpoint: LatLngTuple = [13.69, 100.5005];

            expect(component.projectPointOntoSegment(start, end, midpoint)).toBeCloseTo(0.5, 5);
        });
    });

    describe('perpendicularDistanceKm', () => {
        it('is larger for a point further off the direct line', () => {
            const start: LatLngTuple = [13.69, 100.5];
            const end: LatLngTuple = [13.69, 100.501];
            const near: LatLngTuple = [13.69005, 100.5005];
            const far: LatLngTuple = [13.6903, 100.5005];

            const nearOffset = component.perpendicularDistanceKm(start, end, near, 0.5);
            const farOffset = component.perpendicularDistanceKm(start, end, far, 0.5);

            expect(farOffset).toBeGreaterThan(nearOffset);
        });
    });

    describe('findPlausibleCrossing', () => {
        // Roughly a 108m east-west segment; candidate offsets below were sized against
        // this segment so their projection/detour-ratio numbers land where each test
        // expects.
        const start: LatLngTuple = [13.69, 100.5];
        const end: LatLngTuple = [13.69, 100.501];

        it('prefers the candidate that bends the connector furthest off the direct line, not the one with the smallest detour', () => {
            const near = landmark({ landmarkType: 0, latitude: 13.69005, longitude: 100.5005 });
            const far = landmark({ landmarkType: 1, latitude: 13.6903, longitude: 100.5005 });

            const crossing = component.findPlausibleCrossing(start, end, stopWithLandmarks([near, far]));

            expect(crossing).toEqual(expect.objectContaining({ latitude: far.latitude, longitude: far.longitude }));
        });

        it('excludes a candidate whose detour ratio exceeds the cap', () => {
            const valid = landmark({ landmarkType: 0, latitude: 13.69005, longitude: 100.5005 });
            const tooFarOff = landmark({ landmarkType: 1, latitude: 13.692, longitude: 100.5005 });

            const crossing = component.findPlausibleCrossing(start, end, stopWithLandmarks([valid, tooFarOff]));

            expect(crossing).toEqual(expect.objectContaining({ latitude: valid.latitude, longitude: valid.longitude }));
        });

        it('returns undefined when the only candidate projects well outside the segment', () => {
            const behindStart = landmark({ landmarkType: 0, latitude: 13.69, longitude: 100.498 });

            const crossing = component.findPlausibleCrossing(start, end, stopWithLandmarks([behindStart]));

            expect(crossing).toBeUndefined();
        });

        it('ignores landmarks that are not a Crossing or Skywalk type', () => {
            const mallEntrance = landmark({ landmarkType: 2, latitude: 13.69005, longitude: 100.5005 });

            const crossing = component.findPlausibleCrossing(start, end, stopWithLandmarks([mallEntrance]));

            expect(crossing).toBeUndefined();
        });

        it('returns undefined when the stop has no landmarks', () => {
            const crossing = component.findPlausibleCrossing(start, end, stopWithLandmarks([]));

            expect(crossing).toBeUndefined();
        });
    });

    describe('calculateDistanceKm', () => {
        it('sums the distance across consecutive points', () => {
            const points: LatLngTuple[] = [
                [13.69, 100.5],
                [13.69, 100.501],
                [13.691, 100.501]
            ];

            const total = component.calculateDistanceKm(points);
            const expected = component.distanceBetweenKm(points[0], points[1])
                + component.distanceBetweenKm(points[1], points[2]);

            expect(total).toBeCloseTo(Math.round(expected * 10) / 10, 5);
        });
    });

    describe('findNearestRoutePointIndex', () => {
        it('returns the index of the closest point', () => {
            const points: LatLngTuple[] = [
                [13.69, 100.5],
                [13.695, 100.505],
                [13.7, 100.51]
            ];

            expect(component.findNearestRoutePointIndex(points, [13.696, 100.506])).toBe(1);
        });
    });

    describe('getGpsStatus', () => {
        it('reports searching when accuracy is unknown', () => {
            expect(component.getGpsStatus(undefined)).toBe('กำลังค้นหาตำแหน่ง…');
        });

        it('reports weak signal above 100m', () => {
            expect(component.getGpsStatus(150)).toBe('สัญญาณ GPS อ่อน · กำลังรอค่าที่แม่นขึ้น');
        });

        it('reports adjusting between 50m and 100m', () => {
            expect(component.getGpsStatus(75)).toBe('กำลังปรับตำแหน่ง GPS…');
        });

        it('reports usable between 20m and 50m', () => {
            expect(component.getGpsStatus(30)).toBe('GPS ใช้งานได้');
        });

        it('reports accurate at 20m or below', () => {
            expect(component.getGpsStatus(10)).toBe('GPS แม่นยำ');
        });
    });

    describe('getSmoothedPosition', () => {
        function coords(latitude: number, longitude: number, accuracy: number): GeolocationCoordinates {
            return { latitude, longitude, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null };
        }

        it('returns the single reading unchanged when only one position was recorded', () => {
            component.recentPositions = [coords(13.69, 100.5, 20)];

            const smoothed = component.getSmoothedPosition();

            expect(smoothed.latitude).toBe(13.69);
            expect(smoothed.longitude).toBe(100.5);
        });

        it('weighs the more accurate reading more heavily', () => {
            component.recentPositions = [
                coords(13.69, 100.5, 5), // most accurate: pulls the average closest to it
                coords(13.70, 100.5, 100)
            ];

            const smoothed = component.getSmoothedPosition();

            expect(smoothed.latitude).toBeLessThan(13.695);
            expect(smoothed.latitude).toBeGreaterThan(13.69);
        });
    });
});
