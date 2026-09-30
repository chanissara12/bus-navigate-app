
import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    inject,
    signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import * as L from 'leaflet';

import { BusStopContextResult } from '../../../modules/bus-stop/models/bus-stop.model';
import { BusStopsService } from '../../../modules/bus-stop/services/bus-stops.service';
import { GeoCoordinate } from '../../models/geo-coordinate.model';
import {
    calculateDistanceKm,
    distanceBetweenKm,
    findNearestRoutePointIndex,
    findPlausibleCrossing,
    orientCrossingPath,
    snapToNearbyEntrance
} from '../../helpers/route-geometry.helper';
import { GeolocationService } from '../../services/geolocation.service';
import { RouteShapePoint, RouteShapesService } from '../../services/route-shapes.service';
import { WalkingRouteService } from '../../services/walking-route.service';

@Component({
    selector: 'app-route-map-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './route-map-card.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RouteMapCardComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input({ required: true }) directionId!: number;
    @Input() boardingStopId: number | undefined;
    @Input() alightingStopId: number | undefined;
    @Input() destination: GeoCoordinate | undefined;
    @Input() showWalkingConnectors = false;

    @ViewChild('mapHost', { static: true }) private readonly mapHost!: ElementRef<HTMLDivElement>;

    readonly loading = signal(true);
    readonly error = signal<string | undefined>(undefined);
    readonly routeDistanceKm = signal(0);
    readonly gpsAccuracyMeters = signal<number | undefined>(undefined);
    readonly gpsStatus = signal('กำลังค้นหาตำแหน่ง…');
    readonly legendExpanded = signal(false);

    toggleLegend(): void {
        this.legendExpanded.update((expanded) => !expanded);
    }

    private readonly routeShapesService = inject(RouteShapesService);
    private readonly busStopsService = inject(BusStopsService);
    private readonly geolocationService = inject(GeolocationService);
    private readonly walkingRouteService = inject(WalkingRouteService);
    private readonly destroyRef = inject(DestroyRef);

    // Below this, a new GPS fix isn't worth another OSRM lookup — keeps well under the
    // demo server's 1 req/sec fair-use limit (this app is single-user, low-traffic).
    private static readonly ROUTE_REFRESH_METERS = 15;

    // Above this, a stop is considered "not really on" the GTFS shape — worth asking
    // OSRM for a real driving route instead of trusting the shape-slice ride segment.
    private static readonly RIDE_COVERAGE_THRESHOLD_METERS = 150;

    // A shared crossing/skywalk between an alighting stop and the final destination
    // often gets StopLandmark-associated with whichever one it happens to sit closer
    // to (see StopLandmarkConstants.MaxAssociationDistanceMeters) — not necessarily the
    // alighting stop. Look for a nearby stop around the destination too so its
    // landmarks are also considered.
    private static readonly DESTINATION_LANDMARK_SEARCH_RADIUS_METERS = 150;

    private static readonly WALKING_LINE_STYLE: L.PolylineOptions = {
        color: '#7e22ce',
        dashArray: '8 8',
        weight: 3,
        opacity: 0.9
    };

    private map: L.Map | undefined;
    private routeLine: L.Polyline | undefined;
    private rideLine: L.Polyline | undefined;
    private boardingWalkLines: L.Polyline[] = [];
    private destinationWalkLines: L.Polyline[] = [];
    private lastRoutedPosition: L.LatLngTuple | undefined;
    private positionMarker: L.CircleMarker | undefined;
    private positionAccuracyCircle: L.Circle | undefined;
    private lastAcceptedPosition: { coordinates: GeolocationCoordinates; timestamp: number } | undefined;
    private recentPositions: GeolocationCoordinates[] = [];
    private stopMarkers: L.CircleMarker[] = [];
    private routeEndpointMarkers: L.CircleMarker[] = [];
    private destinationMarker: L.CircleMarker | undefined;
    private lastLoadedDirectionId: number | undefined;
    private boardingStopContext: BusStopContextResult | undefined;
    private alightingStopContext: BusStopContextResult | undefined;

    ngAfterViewInit(): void {
        this.map = L.map(this.mapHost.nativeElement, {
            zoomControl: true,
            attributionControl: true
        });

        // Use Leaflet raster tiles for a reliable, detailed street background.
        // The route/stop markers remain independent layers so each can have its own color.
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors · Data &copy; Office of Transport and Traffic Policy and Planning, Thailand (Namtang), CC BY 4.0 · Walking routes by OSRM'
        }).addTo(this.map);

        this.map.setView([13.7563, 100.5018], 11);
        this.loadMapData();

        const watchPosition = this.geolocationService.watchPosition;
        if (typeof watchPosition === 'function') {
            watchPosition.call(this.geolocationService)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (coordinates) => this.updatePosition(coordinates),
                    error: () => undefined
                });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.map) {
            return;
        }

        if (Object.keys(changes).length > 0) {
            this.loadMapData();
        }
    }

    ngOnDestroy(): void {
        this.map?.remove();
    }

    private loadMapData(): void {
        if (!this.map || !Number.isInteger(this.directionId) || this.directionId <= 0) {
            return;
        }

        this.lastLoadedDirectionId = this.directionId;
        this.loading.set(true);
        this.error.set(undefined);

        const boarding$ = this.boardingStopId === undefined
            ? of<BusStopContextResult | undefined>(undefined)
            : this.busStopsService.getContext(this.boardingStopId).pipe(catchError(() => of(undefined)));

        const alighting$ = this.alightingStopId === undefined
            ? of<BusStopContextResult | undefined>(undefined)
            : this.busStopsService.getContext(this.alightingStopId).pipe(catchError(() => of(undefined)));

        const destinationArea$ = this.destination === undefined
            ? of<BusStopContextResult | undefined>(undefined)
            : this.busStopsService
                .findNearby(
                    this.destination.latitude, this.destination.longitude,
                    RouteMapCardComponent.DESTINATION_LANDMARK_SEARCH_RADIUS_METERS)
                .pipe(
                    switchMap((stops) => stops.length === 0
                        ? of<BusStopContextResult | undefined>(undefined)
                        : this.busStopsService.getContext(stops[0].id)),
                    catchError(() => of(undefined))
                );

        forkJoin({
            shapes: this.routeShapesService.getAllShapes(),
            boarding: boarding$,
            alighting: alighting$,
            destinationArea: destinationArea$
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: ({ shapes, boarding, alighting, destinationArea }) => {
                    const selectedShape = shapes.find((shape) => shape.directionId === this.directionId);
                    this.render(selectedShape?.points ?? [], boarding, alighting, destinationArea);
                    this.loading.set(false);
                },
                error: (err: Error) => {
                    this.loading.set(false);
                    this.error.set(err.message);
                }
            });
    }

    private updatePosition(coordinates: GeolocationCoordinates): void {
        if (!this.map || !Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) {
            return;
        }

        const accuracy = Number.isFinite(coordinates.accuracy)
            ? coordinates.accuracy
            : undefined;
        this.gpsAccuracyMeters.set(accuracy);
        this.gpsStatus.set(this.getGpsStatus(accuracy));

        // Keep the first fix visible, but do not let a poor later fix move the marker.
        if (this.lastAcceptedPosition && accuracy !== undefined && accuracy > 50) {
            return;
        }

        if (this.lastAcceptedPosition) {
            const movementMeters = distanceBetweenKm(
                [this.lastAcceptedPosition.coordinates.latitude, this.lastAcceptedPosition.coordinates.longitude],
                [coordinates.latitude, coordinates.longitude]
            ) * 1000;
            const elapsedSeconds = Math.max(
                1,
                (Date.now() - this.lastAcceptedPosition.timestamp) / 1000
            );

            // Reject an implausibly large jump for a walking user.
            if (movementMeters > Math.max(100, elapsedSeconds * 10)) {
                return;
            }
        }

        this.lastAcceptedPosition = {
            coordinates,
            timestamp: Date.now()
        };

        this.recentPositions.push(coordinates);
        if (this.recentPositions.length > 3) {
            this.recentPositions.shift();
        }

        const smoothedPosition = this.getSmoothedPosition();
        const latLng: L.LatLngExpression = [smoothedPosition.latitude, smoothedPosition.longitude];
        if (!this.positionMarker) {
            this.positionMarker = L.circleMarker(latLng, {
                radius: 8,
                color: '#8F6420',
                fillColor: '#D9A441',
                weight: 3,
                fillOpacity: 1
            }).addTo(this.map);
        } else {
            this.positionMarker.setLatLng(latLng);
        }

        if (accuracy !== undefined) {
            if (!this.positionAccuracyCircle) {
                this.positionAccuracyCircle = L.circle(latLng, {
                    radius: accuracy,
                    color: '#B8842A',
                    weight: 1,
                    fillColor: '#D9A441',
                    fillOpacity: 0.12
                }).addTo(this.map);
            } else {
                this.positionAccuracyCircle.setLatLng(latLng);
                this.positionAccuracyCircle.setRadius(accuracy);
            }
        }

        // Keep the current-position marker above the accuracy area.
        this.positionMarker.bringToFront();

        if (this.showWalkingConnectors && this.boardingStopId !== undefined) {
            this.refreshWalkingConnector();
        }
    }

    private getSmoothedPosition(): GeolocationCoordinates {
        if (this.recentPositions.length === 1) {
            return this.recentPositions[0];
        }

        const weighted = this.recentPositions.reduce(
            (result, position) => {
                const accuracy = Math.max(position.accuracy, 5);
                const weight = 1 / (accuracy * accuracy);

                return {
                    latitude: result.latitude + position.latitude * weight,
                    longitude: result.longitude + position.longitude * weight,
                    weight: result.weight + weight
                };
            },
            { latitude: 0, longitude: 0, weight: 0 }
        );

        return {
            latitude: weighted.latitude / weighted.weight,
            longitude: weighted.longitude / weighted.weight,
            accuracy: this.recentPositions[this.recentPositions.length - 1].accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
        };
    }

    private getGpsStatus(accuracy: number | undefined): string {
        if (accuracy === undefined) {
            return 'กำลังค้นหาตำแหน่ง…';
        }

        if (accuracy > 100) {
            return 'สัญญาณ GPS อ่อน · กำลังรอค่าที่แม่นขึ้น';
        }

        if (accuracy > 50) {
            return 'กำลังปรับตำแหน่ง GPS…';
        }

        if (accuracy > 20) {
            return 'GPS ใช้งานได้';
        }

        return 'GPS แม่นยำ';
    }

    private render(
        shape: RouteShapePoint[],
        boarding: BusStopContextResult | undefined,
        alighting: BusStopContextResult | undefined,
        destinationArea: BusStopContextResult | undefined
    ): void {
        if (!this.map) {
            return;
        }

        this.routeLine?.removeFrom(this.map);
        this.rideLine?.removeFrom(this.map);
        this.boardingWalkLines.forEach((line) => line.removeFrom(this.map!));
        this.destinationWalkLines.forEach((line) => line.removeFrom(this.map!));
        this.stopMarkers.forEach((marker) => marker.removeFrom(this.map!));
        this.routeEndpointMarkers.forEach((marker) => marker.removeFrom(this.map!));
        this.destinationMarker?.removeFrom(this.map);

        this.rideLine = undefined;
        this.boardingWalkLines = [];
        this.destinationWalkLines = [];
        this.lastRoutedPosition = undefined;
        this.stopMarkers = [];
        this.routeEndpointMarkers = [];
        this.destinationMarker = undefined;
        this.boardingStopContext = boarding;
        this.alightingStopContext = alighting;

        const routePoints = shape
            .slice()
            .sort((a, b) => a.sequence - b.sequence)
            .map((point) => [point.latitude, point.longitude] as L.LatLngTuple);

        if (routePoints.length === 0) {
            this.routeDistanceKm.set(0);
            this.error.set('ยังไม่มีข้อมูลเส้นทางสำหรับสายนี้');
            return;
        }

        this.routeDistanceKm.set(calculateDistanceKm(routePoints));

        // แสดงเฉพาะรถสายที่ผู้ใช้ต้องนั่ง: สีเทาคือทั้งสาย
        // และสีน้ำเงินคือช่วงที่ผู้ใช้ต้องนั่งจากป้ายขึ้นถึงป้ายลง
        this.routeLine = L.polyline(routePoints, {
            color: '#94a3b8',
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(this.map);

        if (boarding && alighting) {
            const boardingIndex = findNearestRoutePointIndex(
                routePoints,
                [boarding.latitude, boarding.longitude]
            );
            const alightingIndex = findNearestRoutePointIndex(
                routePoints,
                [alighting.latitude, alighting.longitude]
            );

            const startIndex = Math.min(boardingIndex, alightingIndex);
            const endIndex = Math.max(boardingIndex, alightingIndex);
            // Keep the exact shape points (don't overwrite the ends with the raw stop
            // coordinates) so the ride segment follows the road exactly like the gray
            // full-route line — a bus stop's own lat/lng is often a little off the
            // road centerline, which used to make the green line visibly cut away
            // from the road right at both ends.
            const ridePoints = routePoints.slice(startIndex, endIndex + 1);

            if (ridePoints.length >= 2) {
                this.routeDistanceKm.set(calculateDistanceKm(ridePoints));

                const rideLine = L.polyline(ridePoints, {
                    color: '#178F79',
                    weight: 7,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round'
                }).addTo(this.map);

                this.rideLine = rideLine;

                // GTFS shape data sometimes doesn't reach a stop at all (confirmed
                // against several real Bangkok routes/areas — not an isolated glitch),
                // collapsing the ride segment to almost nothing even though the bus
                // genuinely serves both stops. When either end is implausibly far from
                // its matched shape point, ask OSRM for the real road path between the
                // stops directly (buses use the same road network as cars) and use
                // that instead — same detour-guarded, best-effort service as the
                // walking connector, just with the 'driving' profile.
                const boardingCoverageKm = distanceBetweenKm(
                    routePoints[boardingIndex], [boarding.latitude, boarding.longitude]);
                const alightingCoverageKm = distanceBetweenKm(
                    routePoints[alightingIndex], [alighting.latitude, alighting.longitude]);

                if (Math.max(boardingCoverageKm, alightingCoverageKm) * 1000 > RouteMapCardComponent.RIDE_COVERAGE_THRESHOLD_METERS) {
                    this.walkingRouteService
                        .getRoute(
                            [boarding.latitude, boarding.longitude],
                            [alighting.latitude, alighting.longitude],
                            'driving')
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe((route) => {
                            if (route && this.rideLine === rideLine) {
                                rideLine.setLatLngs(route);
                                this.routeDistanceKm.set(calculateDistanceKm(route));
                            }
                        });
                }
            }
        }

        this.addRouteEndpointMarkers(routePoints);

        if (boarding) {
            this.addStopMarker(boarding, 'จุดขึ้นรถ');
        }

        if (alighting) {
            this.addStopMarker(alighting, 'จุดลงรถ');
        }

        if (this.destination) {
            this.addDestinationMarker(this.destination);
        }

        if (this.showWalkingConnectors) {
            if (boarding) {
                this.updateBoardingWalkingConnector(boarding);
            }

            if (alighting && this.destination) {
                // A shared skywalk/crossing near the destination can be
                // StopLandmark-associated with a different nearby stop than the
                // alighting one (see DESTINATION_LANDMARK_SEARCH_RADIUS_METERS note
                // above) — consider both sets of landmarks, not just the alighting
                // stop's own.
                const landmarks = [...alighting.landmarks, ...(destinationArea?.landmarks ?? [])];
                this.updateWalkingLine(
                    [alighting.latitude, alighting.longitude],
                    [this.destination.latitude, this.destination.longitude],
                    landmarks,
                    (lines) => this.setDestinationWalkLines(lines)
                );
            }
        }

        const bounds = this.routeLine.getBounds();
        if (this.positionMarker) {
            bounds.extend(this.positionMarker.getLatLng());
        }

        this.map.fitBounds(bounds.pad(0.15));
    }

    private addStopMarker(stop: BusStopContextResult, label: string): void {
        if (!this.map) {
            return;
        }

        const isBoarding = label === 'จุดขึ้นรถ';
        const marker = L.circleMarker([stop.latitude, stop.longitude], {
            radius: 8,
            color: isBoarding ? '#2E3D8F' : '#116054',
            fillColor: isBoarding ? '#5566D6' : '#4FB3A9',
            weight: 3,
            fillOpacity: 0.95
        }).addTo(this.map);

        marker.bindTooltip(label);
        marker.bindPopup(`<strong>${label}</strong><br>${stop.nameTh}`);
        this.stopMarkers.push(marker);
    }

    private addRouteEndpointMarkers(routePoints: L.LatLngTuple[]): void {
        if (!this.map || routePoints.length < 2) {
            return;
        }

        const start = L.circleMarker(routePoints[0], {
            radius: 7,
            color: '#0f766e',
            fillColor: '#2dd4bf',
            weight: 3,
            fillOpacity: 0.95
        }).addTo(this.map);
        start.bindTooltip('ต้นทางของเส้นทาง');
        start.bindPopup('<strong>ต้นทางของเส้นทาง</strong>');

        const end = L.circleMarker(routePoints[routePoints.length - 1], {
            radius: 7,
            color: '#c026d3',
            fillColor: '#e879f9',
            weight: 3,
            fillOpacity: 0.95
        }).addTo(this.map);
        end.bindTooltip('ปลายทางของเส้นทาง');
        end.bindPopup('<strong>ปลายทางของเส้นทาง</strong>');

        this.routeEndpointMarkers.push(start, end);
    }

    private addDestinationMarker(destination: GeoCoordinate): void {
        if (!this.map) {
            return;
        }

        this.destinationMarker = L.circleMarker(
            [destination.latitude, destination.longitude],
            {
                radius: 9,
                color: '#b91c1c',
                fillColor: '#ef4444',
                weight: 3,
                fillOpacity: 0.95
            }
        ).addTo(this.map);

        this.destinationMarker.bindTooltip('จุดหมายของคุณ');
        this.destinationMarker.bindPopup('<strong>จุดหมายของคุณ</strong>');
    }

    private createWalkingPolyline(points: L.LatLngExpression[]): L.Polyline {
        return L.polyline(points, RouteMapCardComponent.WALKING_LINE_STYLE);
    }

    private setBoardingWalkLines(lines: L.Polyline[]): void {
        if (!this.map) {
            return;
        }
        this.boardingWalkLines.forEach((line) => line.removeFrom(this.map!));
        this.boardingWalkLines = lines.map((line) => line.addTo(this.map!));
    }

    private setDestinationWalkLines(lines: L.Polyline[]): void {
        if (!this.map) {
            return;
        }
        this.destinationWalkLines.forEach((line) => line.removeFrom(this.map!));
        this.destinationWalkLines = lines.map((line) => line.addTo(this.map!));
    }

    // Approximate straight-line connector (T17), via a plausible road-crossing/skywalk
    // landmark if one exists — walking its real path (e.g. a footbridge's OSM way
    // geometry) rather than just bending toward its center point. Used as an instant
    // fallback while the real routed path below is still loading, and again if it
    // never arrives.
    private buildApproximateWalkingLines(
        start: L.LatLngTuple, end: L.LatLngTuple, landmarks: BusStopContextResult['landmarks']
    ): L.Polyline[] {
        const crossing = findPlausibleCrossing(start, end, landmarks);
        if (crossing) {
            const viaPoints = orientCrossingPath(crossing, start);
            const lastViaPoint = viaPoints[viaPoints.length - 1];
            const walkEnd = snapToNearbyEntrance(lastViaPoint, landmarks) ?? end;
            return [
                this.createWalkingPolyline([start, ...viaPoints]),
                this.createWalkingPolyline([lastViaPoint, walkEnd])
            ];
        }

        return [this.createWalkingPolyline([start, end])];
    }

    // Real road/sidewalk-following path via OSRM — replaces the approximate connector
    // above once (if) it resolves; falls back silently otherwise.
    private updateWalkingLine(
        start: L.LatLngTuple, end: L.LatLngTuple, landmarks: BusStopContextResult['landmarks'],
        setLines: (lines: L.Polyline[]) => void
    ): void {
        setLines(this.buildApproximateWalkingLines(start, end, landmarks));

        this.walkingRouteService.getRoute(start, end)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((route) => {
                if (route) {
                    setLines([this.createWalkingPolyline(route)]);
                }
            });
    }

    private updateBoardingWalkingConnector(stop: BusStopContextResult): void {
        const position = this.positionMarker?.getLatLng();
        if (!position) {
            return;
        }

        const start: L.LatLngTuple = [position.lat, position.lng];
        this.updateWalkingLine(start, [stop.latitude, stop.longitude], stop.landmarks,
            (lines) => this.setBoardingWalkLines(lines));
    }

    private refreshWalkingConnector(): void {
        if (!this.boardingStopContext) {
            return;
        }

        const position = this.positionMarker?.getLatLng();
        if (!position) {
            return;
        }

        const current: L.LatLngTuple = [position.lat, position.lng];
        if (this.lastRoutedPosition
            && distanceBetweenKm(this.lastRoutedPosition, current) * 1000 < RouteMapCardComponent.ROUTE_REFRESH_METERS) {
            return;
        }
        this.lastRoutedPosition = current;

        this.updateBoardingWalkingConnector(this.boardingStopContext);
    }
}
