import { StopLandmark } from '../../modules/bus-stop/models/bus-stop.model';
import {
    calculateDistanceKm,
    distanceBetweenKm,
    findNearestRoutePointIndex,
    findPlausibleCrossing,
    perpendicularDistanceKm,
    projectPointOntoSegment
} from './route-geometry.helper';

type LatLngTuple = [number, number];

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

describe('route-geometry.helper', () => {
    describe('distanceBetweenKm', () => {
        it('returns 0 for identical points', () => {
            const point: LatLngTuple = [13.69, 100.5];

            expect(distanceBetweenKm(point, point)).toBe(0);
        });

        it('matches the known ~111.19km for one degree of latitude', () => {
            const distance = distanceBetweenKm([0, 0], [1, 0]);

            expect(distance).toBeCloseTo(111.19, 1);
        });
    });

    describe('projectPointOntoSegment', () => {
        const start: LatLngTuple = [13.69, 100.5];
        const end: LatLngTuple = [13.69, 100.501];

        it('returns 0 for a point at the start', () => {
            expect(projectPointOntoSegment(start, end, start)).toBeCloseTo(0, 5);
        });

        it('returns 1 for a point at the end', () => {
            expect(projectPointOntoSegment(start, end, end)).toBeCloseTo(1, 5);
        });

        it('returns 0.5 for the midpoint', () => {
            const midpoint: LatLngTuple = [13.69, 100.5005];

            expect(projectPointOntoSegment(start, end, midpoint)).toBeCloseTo(0.5, 5);
        });
    });

    describe('perpendicularDistanceKm', () => {
        it('is larger for a point further off the direct line', () => {
            const start: LatLngTuple = [13.69, 100.5];
            const end: LatLngTuple = [13.69, 100.501];
            const near: LatLngTuple = [13.69005, 100.5005];
            const far: LatLngTuple = [13.6903, 100.5005];

            const nearOffset = perpendicularDistanceKm(start, end, near, 0.5);
            const farOffset = perpendicularDistanceKm(start, end, far, 0.5);

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

            const crossing = findPlausibleCrossing(start, end, [near, far]);

            expect(crossing).toEqual(expect.objectContaining({ latitude: far.latitude, longitude: far.longitude }));
        });

        it('excludes a candidate whose detour ratio exceeds the cap', () => {
            const valid = landmark({ landmarkType: 0, latitude: 13.69005, longitude: 100.5005 });
            const tooFarOff = landmark({ landmarkType: 1, latitude: 13.692, longitude: 100.5005 });

            const crossing = findPlausibleCrossing(start, end, [valid, tooFarOff]);

            expect(crossing).toEqual(expect.objectContaining({ latitude: valid.latitude, longitude: valid.longitude }));
        });

        it('returns undefined when the only candidate projects well outside the segment', () => {
            const behindStart = landmark({ landmarkType: 0, latitude: 13.69, longitude: 100.498 });

            const crossing = findPlausibleCrossing(start, end, [behindStart]);

            expect(crossing).toBeUndefined();
        });

        it('ignores landmarks that are not a Crossing or Skywalk type', () => {
            const mallEntrance = landmark({ landmarkType: 2, latitude: 13.69005, longitude: 100.5005 });

            const crossing = findPlausibleCrossing(start, end, [mallEntrance]);

            expect(crossing).toBeUndefined();
        });

        it('returns undefined when the stop has no landmarks', () => {
            const crossing = findPlausibleCrossing(start, end, []);

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

            const total = calculateDistanceKm(points);
            const expected = distanceBetweenKm(points[0], points[1])
                + distanceBetweenKm(points[1], points[2]);

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

            expect(findNearestRoutePointIndex(points, [13.696, 100.506])).toBe(1);
        });
    });
});
