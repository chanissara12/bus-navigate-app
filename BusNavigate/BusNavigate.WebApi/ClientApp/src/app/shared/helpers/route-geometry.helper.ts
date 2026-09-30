import type { LatLngTuple } from 'leaflet';

import type { BusStopContextResult } from '../../modules/bus-stop/models/bus-stop.model';

export function findNearestRoutePointIndex(
    routePoints: LatLngTuple[],
    target: LatLngTuple
): number {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    routePoints.forEach((point, index) => {
        const distance = distanceBetweenKm(point, target);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
        }
    });

    return nearestIndex;
}

export function calculateDistanceKm(points: LatLngTuple[]): number {
    let distanceKm = 0;

    for (let index = 1; index < points.length; index++) {
        distanceKm += distanceBetweenKm(points[index - 1], points[index]);
    }

    return Math.round(distanceKm * 10) / 10;
}

export function distanceBetweenKm(
    first: LatLngTuple,
    second: LatLngTuple
): number {
    const earthRadiusKm = 6371;
    const latitude1 = first[0] * Math.PI / 180;
    const latitude2 = second[0] * Math.PI / 180;
    const deltaLatitude = (second[0] - first[0]) * Math.PI / 180;
    const deltaLongitude = (second[1] - first[1]) * Math.PI / 180;

    const a = Math.sin(deltaLatitude / 2) ** 2
        + Math.cos(latitude1)
        * Math.cos(latitude2)
        * Math.sin(deltaLongitude / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findPlausibleCrossing(
    start: LatLngTuple,
    end: LatLngTuple,
    landmarks: BusStopContextResult['landmarks']
): { latitude: number; longitude: number } | undefined {
    const directDistanceKm = distanceBetweenKm(start, end);
    if (directDistanceKm === 0) {
        return undefined;
    }

    const candidates = landmarks
        .filter((landmark) => landmark.landmarkType === 0 || landmark.landmarkType === 1)
        .map((landmark) => {
            const point: LatLngTuple = [landmark.latitude, landmark.longitude];
            const projection = projectPointOntoSegment(start, end, point);

            return {
                ...landmark,
                point,
                projection,
                detourRatio:
                    (distanceBetweenKm(start, point) + distanceBetweenKm(point, end))
                    / directDistanceKm,
                perpendicularDistanceKm: perpendicularDistanceKm(start, end, point, projection)
            };
        })
        .filter((landmark) => landmark.projection >= -0.15
            && landmark.projection <= 1.15
            && landmark.detourRatio <= 1.35)
        // A Skywalk (grade-separated, safer) always beats a Crossing (at-grade) when
        // both are plausible — this connector exists to steer toward the safer
        // option, not just the more visually obvious bend. OSM often splits one real
        // structure into several disconnected way fragments (the road-spanning deck
        // plus short stair/ramp stubs at each end) — all tagged Skywalk, all
        // technically "plausible" — so within the same type, the longest geometry
        // (the actual spanning deck, not a short stub) wins next. Only after that does
        // "furthest off the direct line" decide: a crossing right next to the stop
        // passes the detour-ratio check easily but the resulting dashed connector
        // barely bends, so the user can't visually tell the walking path is avoiding
        // the road.
        .sort((first, second) => {
            const typeRank = (landmark: typeof first) => landmark.landmarkType === 1 ? 0 : 1;
            const typeDelta = typeRank(first) - typeRank(second);
            if (typeDelta !== 0) {
                return typeDelta;
            }

            const lengthDelta = geometryPathLengthKm(second.geometry) - geometryPathLengthKm(first.geometry);
            return lengthDelta !== 0 ? lengthDelta : second.perpendicularDistanceKm - first.perpendicularDistanceKm;
        });

    return candidates[0];
}

// Raw (unrounded) total length — calculateDistanceKm rounds to 0.1km, far too coarse
// to tell apart a short stair stub (~0.01km) from a road-spanning deck (~0.04km).
function geometryPathLengthKm(geometry?: { latitude: number; longitude: number }[]): number {
    if (!geometry || geometry.length < 2) {
        return 0;
    }

    let totalKm = 0;
    for (let index = 1; index < geometry.length; index++) {
        totalKm += distanceBetweenKm(
            [geometry[index - 1].latitude, geometry[index - 1].longitude],
            [geometry[index].latitude, geometry[index].longitude]
        );
    }

    return totalKm;
}

// Orients a plausible-crossing landmark's real OSM way geometry (arbitrary node
// order) so it runs from the `start` side toward the `end` side. Falls back to the
// landmark's own point for a point landmark (Crossing) or one with no geometry.
export function orientCrossingPath(
    crossing: { latitude: number; longitude: number; geometry?: { latitude: number; longitude: number }[] },
    start: LatLngTuple
): LatLngTuple[] {
    if (!crossing.geometry || crossing.geometry.length < 2) {
        return [[crossing.latitude, crossing.longitude]];
    }

    const points: LatLngTuple[] = crossing.geometry.map((point) => [point.latitude, point.longitude]);
    const first = points[0];
    const last = points[points.length - 1];

    return distanceBetweenKm(start, first) <= distanceBetweenKm(start, last) ? points : points.reverse();
}

const MALL_ENTRANCE_SNAP_METERS = 15;

// A skywalk crossing often lands right at a building's mapped entrance (LandmarkType
// MallEntrance) — e.g. a skywalk deck ending at a mall's upper-floor door. When it
// does, that entrance IS the real arrival point: the walk should stop there rather
// than continue on a straight line toward the destination's raw coordinate (which may
// sit further inside the building, unreachable by any outdoor path).
export function snapToNearbyEntrance(
    point: LatLngTuple, landmarks: BusStopContextResult['landmarks']
): LatLngTuple | undefined {
    const entrance = landmarks.find((landmark) => landmark.landmarkType === 2
        && distanceBetweenKm(point, [landmark.latitude, landmark.longitude]) * 1000 <= MALL_ENTRANCE_SNAP_METERS);

    return entrance ? [entrance.latitude, entrance.longitude] : undefined;
}

// Distance from `point` to its projection onto the infinite line through start/end,
// found by walking `projection` (from projectPointOntoSegment) along that line.
export function perpendicularDistanceKm(
    start: LatLngTuple,
    end: LatLngTuple,
    point: LatLngTuple,
    projection: number
): number {
    const footPoint: LatLngTuple = [
        start[0] + (end[0] - start[0]) * projection,
        start[1] + (end[1] - start[1]) * projection
    ];

    return distanceBetweenKm(point, footPoint);
}

export function projectPointOntoSegment(
    start: LatLngTuple,
    end: LatLngTuple,
    point: LatLngTuple
): number {
    const latitudeScale = Math.cos(((start[0] + end[0]) / 2) * Math.PI / 180);
    const dx = (end[1] - start[1]) * latitudeScale;
    const dy = end[0] - start[0];
    const px = (point[1] - start[1]) * latitudeScale;
    const py = point[0] - start[0];
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        return 0;
    }

    return (px * dx + py * dy) / lengthSquared;
}
