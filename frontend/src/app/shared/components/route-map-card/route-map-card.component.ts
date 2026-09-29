
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
import { catchError } from 'rxjs/operators';
import * as L from 'leaflet';

import { BusStopContextResult } from '../../../modules/bus-stop/models/bus-stop.model';
import { BusStopsService } from '../../../modules/bus-stop/services/bus-stops.service';
import { GeoCoordinate } from '../../models/geo-coordinate.model';
import { GeolocationService } from '../../services/geolocation.service';
import { RouteShapePoint, RouteShapesService } from '../../services/route-shapes.service';

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
    private readonly destroyRef = inject(DestroyRef);

    private map: L.Map | undefined;
    private routeLine: L.Polyline | undefined;
    private rideLine: L.Polyline | undefined;
    private walkingLines: L.Polyline[] = [];
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
            attribution: '&copy; OpenStreetMap contributors · Data &copy; Office of Transport and Traffic Policy and Planning, Thailand (Namtang), CC BY 4.0'
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

        forkJoin({
            shapes: this.routeShapesService.getAllShapes(),
            boarding: boarding$,
            alighting: alighting$
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: ({ shapes, boarding, alighting }) => {
                    const selectedShape = shapes.find((shape) => shape.directionId === this.directionId);
                    this.render(selectedShape?.points ?? [], boarding, alighting);
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
            const movementMeters = this.distanceBetweenKm(
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
        alighting: BusStopContextResult | undefined
    ): void {
        if (!this.map) {
            return;
        }

        this.routeLine?.removeFrom(this.map);
        this.rideLine?.removeFrom(this.map);
        this.walkingLines.forEach((line) => line.removeFrom(this.map!));
        this.stopMarkers.forEach((marker) => marker.removeFrom(this.map!));
        this.routeEndpointMarkers.forEach((marker) => marker.removeFrom(this.map!));
        this.destinationMarker?.removeFrom(this.map);

        this.rideLine = undefined;
        this.walkingLines = [];
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

        this.routeDistanceKm.set(this.calculateDistanceKm(routePoints));

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
            const boardingIndex = this.findNearestRoutePointIndex(
                routePoints,
                [boarding.latitude, boarding.longitude]
            );
            const alightingIndex = this.findNearestRoutePointIndex(
                routePoints,
                [alighting.latitude, alighting.longitude]
            );

            const startIndex = Math.min(boardingIndex, alightingIndex);
            const endIndex = Math.max(boardingIndex, alightingIndex);
            const ridePoints = routePoints.slice(startIndex, endIndex + 1);

            if (ridePoints.length >= 2) {
                ridePoints[0] = [boarding.latitude, boarding.longitude];
                ridePoints[ridePoints.length - 1] = [alighting.latitude, alighting.longitude];
                this.routeDistanceKm.set(this.calculateDistanceKm(ridePoints));

                const rideLine = L.polyline(ridePoints, {
                    color: '#178F79',
                    weight: 7,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round'
                }).addTo(this.map);

                this.rideLine = rideLine;
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
                this.addWalkingLineToStop(boarding);
            }

            if (alighting && this.destination) {
                this.addWalkingLine(
                    [alighting.latitude, alighting.longitude],
                    [this.destination.latitude, this.destination.longitude]
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

    private findNearestRoutePointIndex(
        routePoints: L.LatLngTuple[],
        target: L.LatLngTuple
    ): number {
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        routePoints.forEach((point, index) => {
            const distance = this.distanceBetweenKm(point, target);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });

        return nearestIndex;
    }

    private calculateDistanceKm(points: L.LatLngTuple[]): number {
        let distanceKm = 0;

        for (let index = 1; index < points.length; index++) {
            distanceKm += this.distanceBetweenKm(points[index - 1], points[index]);
        }

        return Math.round(distanceKm * 10) / 10;
    }

    private distanceBetweenKm(
        first: L.LatLngTuple,
        second: L.LatLngTuple
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

    private addWalkingLineToStop(stop: BusStopContextResult): void {
        const position = this.positionMarker?.getLatLng();
        if (!position) {
            return;
        }

        const start: L.LatLngTuple = [position.lat, position.lng];
        const end: L.LatLngTuple = [stop.latitude, stop.longitude];
        const crossing = this.findPlausibleCrossing(start, end, stop);

        if (crossing) {
            this.addWalkingLine(start, [crossing.latitude, crossing.longitude]);
            this.addWalkingLine([crossing.latitude, crossing.longitude], end);
            return;
        }

        this.addWalkingLine(start, end);
    }

    private findPlausibleCrossing(
        start: L.LatLngTuple,
        end: L.LatLngTuple,
        stop: BusStopContextResult
    ): { latitude: number; longitude: number } | undefined {
        const directDistanceKm = this.distanceBetweenKm(start, end);
        if (directDistanceKm === 0) {
            return undefined;
        }

        const candidates = stop.landmarks
            .filter((landmark) => landmark.landmarkType === 0 || landmark.landmarkType === 1)
            .map((landmark) => {
                const point: L.LatLngTuple = [landmark.latitude, landmark.longitude];
                const projection = this.projectPointOntoSegment(start, end, point);

                return {
                    ...landmark,
                    point,
                    projection,
                    detourRatio:
                        (this.distanceBetweenKm(start, point) + this.distanceBetweenKm(point, end))
                        / directDistanceKm,
                    perpendicularDistanceKm: this.perpendicularDistanceKm(start, end, point, projection)
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
    private perpendicularDistanceKm(
        start: L.LatLngTuple,
        end: L.LatLngTuple,
        point: L.LatLngTuple,
        projection: number
    ): number {
        const footPoint: L.LatLngTuple = [
            start[0] + (end[0] - start[0]) * projection,
            start[1] + (end[1] - start[1]) * projection
        ];

        return this.distanceBetweenKm(point, footPoint);
    }

    private projectPointOntoSegment(
        start: L.LatLngTuple,
        end: L.LatLngTuple,
        point: L.LatLngTuple
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

    private addWalkingLine(start: L.LatLngExpression, end: L.LatLngExpression): void {
        if (!this.map) {
            return;
        }

        this.walkingLines.push(
            L.polyline([start, end], {
                color: '#7e22ce',
                dashArray: '8 8',
                weight: 3,
                opacity: 0.9
            }).addTo(this.map)
        );
    }

    private refreshWalkingConnector(): void {
        this.walkingLines.forEach((line) => line.removeFrom(this.map!));
        this.walkingLines = [];

        if (this.boardingStopContext) {
            this.addWalkingLineToStop(this.boardingStopContext);
        }

        if (this.alightingStopContext && this.destination) {
            this.addWalkingLine(
                [this.alightingStopContext.latitude, this.alightingStopContext.longitude],
                [this.destination.latitude, this.destination.longitude]
            );
        }
    }
}
