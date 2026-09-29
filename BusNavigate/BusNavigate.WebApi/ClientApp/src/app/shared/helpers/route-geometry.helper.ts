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
        // Prefer the candidate furthest off the direct line, not the one with the
        // smallest detour: a crossing right next to the stop passes the detour-ratio
        // check easily but the resulting dashed connector barely bends, so the user
        // can't visually tell the walking path is avoiding the road.
        .sort((first, second) => second.perpendicularDistanceKm - first.perpendicularDistanceKm);

    return candidates[0];
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
