import { StopLandmark } from '../../modules/bus-stop/models/bus-stop.model';
import {
    calculateDistanceKm,
    distanceBetweenKm,
    findNearestRoutePointIndex,
    findPlausibleCrossing,
    orientCrossingPath,
    perpendicularDistanceKm,
    projectPointOntoSegment,
    snapToNearbyEntrance
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
        geometry: [],
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

        it('prefers a Skywalk over a Crossing even when the Crossing bends the line further off the direct path', () => {
            // Reproduces a real case (a BRT stop and a nearby mall's shared canal
            // crossing): the at-grade Crossing landmark happened to sit further off
            // the direct line than the genuinely safer Skywalk — bend-distance alone
            // would have picked the unsafe option.
            const crossing = landmark({ landmarkType: 0, latitude: 13.6903, longitude: 100.5005 });
            const skywalk = landmark({ landmarkType: 1, latitude: 13.69005, longitude: 100.5005 });

            const result = findPlausibleCrossing(start, end, [crossing, skywalk]);

            expect(result).toEqual(expect.objectContaining({ latitude: skywalk.latitude, longitude: skywalk.longitude }));
        });

        it('prefers the longer Skywalk fragment (the road-spanning deck) over a short stair stub at the same crossing', () => {
            // Reproduces a real case: OSM split one physical footbridge into a
            // ~40m road-spanning deck plus two ~10m stair stubs at each end, all
            // tagged Skywalk — the stub is not what actually gets you across the road.
            const stub = landmark({
                landmarkType: 1,
                latitude: 13.6901102,
                longitude: 100.5005,
                geometry: [
                    { latitude: 13.6901161, longitude: 100.5004586 },
                    { latitude: 13.6901043, longitude: 100.5005414 }
                ]
            });
            const deck = landmark({
                landmarkType: 1,
                latitude: 13.6897964,
                longitude: 100.5005,
                geometry: [
                    { latitude: 13.6894854, longitude: 100.5004616 },
                    { latitude: 13.6897115, longitude: 100.5004833 },
                    { latitude: 13.6897170, longitude: 100.5005437 },
                    { latitude: 13.6900758, longitude: 100.5004902 }
                ]
            });

            const result = findPlausibleCrossing(start, end, [stub, deck]);

            expect(result).toEqual(expect.objectContaining({ latitude: deck.latitude, longitude: deck.longitude }));
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

    describe('orientCrossingPath', () => {
        const walkStart: LatLngTuple = [13.69, 100.5];

        it('returns the single point as-is when the landmark has no geometry', () => {
            const crossing = { latitude: 13.6905, longitude: 100.5005 };

            expect(orientCrossingPath(crossing, walkStart)).toEqual([[13.6905, 100.5005]]);
        });

        it('keeps the geometry order when it already runs from the start side', () => {
            const crossing = {
                latitude: 0,
                longitude: 0,
                geometry: [
                    { latitude: 13.6901, longitude: 100.5001 },
                    { latitude: 13.6903, longitude: 100.5003 }
                ]
            };

            expect(orientCrossingPath(crossing, walkStart)).toEqual([[13.6901, 100.5001], [13.6903, 100.5003]]);
        });

        it('reverses the geometry when its first point is further from the start than its last', () => {
            const crossing = {
                latitude: 0,
                longitude: 0,
                geometry: [
                    { latitude: 13.6903, longitude: 100.5003 },
                    { latitude: 13.6901, longitude: 100.5001 }
                ]
            };

            expect(orientCrossingPath(crossing, walkStart)).toEqual([[13.6901, 100.5001], [13.6903, 100.5003]]);
        });
    });

    describe('snapToNearbyEntrance', () => {
        it('snaps to a mapped MallEntrance within range', () => {
            // Reproduces a real skywalk landing directly at Terminal 21's upper-floor
            // door (an OSM node tagged entrance=yes, ~10m from the deck's endpoint).
            const entrance = landmark({ landmarkType: 2, latitude: 13.6895, longitude: 100.5006 });

            const result = snapToNearbyEntrance([13.6894, 100.5006], [entrance]);

            expect(result).toEqual([13.6895, 100.5006]);
        });

        it('returns undefined when no MallEntrance is within range', () => {
            const farEntrance = landmark({ landmarkType: 2, latitude: 13.70, longitude: 100.51 });

            const result = snapToNearbyEntrance([13.6894, 100.5006], [farEntrance]);

            expect(result).toBeUndefined();
        });

        it('ignores a landmark that is not a MallEntrance even if very close', () => {
            const crossing = landmark({ landmarkType: 0, latitude: 13.6895, longitude: 100.5006 });

            const result = snapToNearbyEntrance([13.6894, 100.5006], [crossing]);

            expect(result).toBeUndefined();
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
