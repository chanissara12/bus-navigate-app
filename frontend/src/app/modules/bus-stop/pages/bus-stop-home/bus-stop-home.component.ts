import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ErrorNotificationService } from '../../../../shared/services/error-notification.service';
import { GeolocationService } from '../../../../shared/services/geolocation.service';
import { BusStopContextResult, BusStopSummary } from '../../models/bus-stop.model';
import { BusStopsService } from '../../services/bus-stops.service';

const NEARBY_RADIUS_METERS = 1000;

@Component({
    selector: 'app-bus-stop-home',
    templateUrl: './bus-stop-home.component.html',
    styleUrl: './bus-stop-home.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusStopHomeComponent {
    private readonly busStopsService = inject(BusStopsService);
    private readonly errorNotificationService = inject(ErrorNotificationService);
    private readonly geolocationService = inject(GeolocationService);
    private readonly destroyRef = inject(DestroyRef);

    readonly currentPosition = signal<GeolocationCoordinates | undefined>(undefined);
    readonly locationError = signal<string | undefined>(undefined);

    readonly stops = signal<BusStopSummary[] | undefined>(undefined);
    readonly stopsLoading = signal(false);

    readonly expandedId = signal<number | undefined>(undefined);
    readonly expandedContext = signal<BusStopContextResult | undefined>(undefined);
    readonly expandedLoading = signal(false);

    readonly latestError = signal<string | undefined>(undefined);
    readonly errorSettled = signal(false);

    readonly landmarkIcon = (landmarkType: number): string => {
        switch (landmarkType) {
            case 0: return '🚶';
            case 1: return '🌉';
            case 2: return '🏬';
            case 4: return '🚉';
            default: return '📍';
        }
    };

    readonly landmarkLabel = (landmarkType: number): string => {
        switch (landmarkType) {
            case 0: return 'ทางข้าม';
            case 1: return 'สกายวอล์ก';
            case 2: return 'ทางเข้าห้าง';
            case 4: return 'จุดเชื่อมสถานีขนส่ง';
            default: return 'จุดสังเกต';
        }
    };

    constructor() {
        this.loadCurrentPosition();

        this.errorNotificationService.errors$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((message) => {
                this.latestError.set(message);
                this.errorSettled.set(false);
                setTimeout(() => this.errorSettled.set(true));
            });
    }

    retryLocation(): void {
        this.loadCurrentPosition();
    }

    toggle(stop: BusStopSummary): void {
        if (this.expandedId() === stop.id) {
            this.expandedId.set(undefined);
            this.expandedContext.set(undefined);
            return;
        }

        this.expandedId.set(stop.id);
        this.expandedContext.set(undefined);
        this.expandedLoading.set(true);

        this.busStopsService
            .getContext(stop.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (context) => {
                    if (this.expandedId() === stop.id) {
                        this.expandedContext.set(context);
                    }
                    this.expandedLoading.set(false);
                },
                error: (err: Error) => {
                    this.expandedLoading.set(false);
                    this.errorNotificationService.notify(err.message);
                }
            });
    }

    dismissError(): void {
        this.latestError.set(undefined);
    }

    private loadCurrentPosition(): void {
        this.locationError.set(undefined);
        this.stops.set(undefined);
        this.expandedId.set(undefined);
        this.expandedContext.set(undefined);
        this.geolocationService
            .getCurrentPosition()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (coords) => {
                    this.currentPosition.set(coords);
                    this.loadNearbyStops(coords);
                },
                error: (err: Error) => this.locationError.set(err.message)
            });
    }

    private loadNearbyStops(coords: GeolocationCoordinates): void {
        this.stopsLoading.set(true);
        this.busStopsService
            .findNearby(coords.latitude, coords.longitude, NEARBY_RADIUS_METERS)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (stops) => {
                    this.stopsLoading.set(false);
                    this.stops.set(stops);
                },
                error: (err: Error) => {
                    this.stopsLoading.set(false);
                    this.stops.set(undefined);
                    this.errorNotificationService.notify(err.message);
                }
            });
    }
}
