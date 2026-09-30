import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import type { LatLngTuple } from 'leaflet';

import { distanceBetweenKm } from '../helpers/route-geometry.helper';

export type OsrmProfile = 'foot' | 'driving';

interface OsrmRouteResponse {
    routes: { distance: number; geometry: { coordinates: [number, number][] } }[];
}

// Real road-following path via OSRM's public demo server, for either a walking
// connector ('foot') or a bus's own ride segment when GTFS shape data doesn't cover it
// ('driving' — buses use the same road network as cars; see route-map-card.component's
// ride-segment coverage check). Fair-use only, best-effort, no SLA (see
// project-osrm.org policy) — this app is single-user/low-traffic, well under the
// 1 req/sec limit. Every caller must treat `undefined` (network error, no route found,
// or an implausible detour) as "fall back to the approximate/existing connector,"
// never as a hard failure.
@Injectable({ providedIn: 'root' })
export class WalkingRouteService {
    // OSM's road/pedestrian path data is sparse in some areas (confirmed against a
    // real Bangkok stop: a ~260m straight-line gap came back as a 1179m routed detour)
    // — reject a route this disproportionate rather than show a confusing loop.
    private static readonly MAX_DETOUR_RATIO = 2.5;

    constructor(private readonly http: HttpClient) {}

    getRoute(start: LatLngTuple, end: LatLngTuple, profile: OsrmProfile = 'foot'): Observable<LatLngTuple[] | undefined> {
        const url = `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}`
            + '?geometries=geojson&overview=full';

        return this.http.get<OsrmRouteResponse>(url).pipe(
            map((response) => {
                const route = response.routes[0];
                const coordinates = route?.geometry.coordinates;
                if (!coordinates || coordinates.length === 0) {
                    return undefined;
                }

                const straightLineKm = distanceBetweenKm(start, end);
                if (straightLineKm > 0 && route.distance / 1000 / straightLineKm > WalkingRouteService.MAX_DETOUR_RATIO) {
                    return undefined;
                }

                return coordinates.map(([longitude, latitude]) => [latitude, longitude] as LatLngTuple);
            }),
            catchError(() => of(undefined))
        );
    }
}
