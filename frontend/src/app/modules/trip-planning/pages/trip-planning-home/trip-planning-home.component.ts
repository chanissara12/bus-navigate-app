import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { ActiveSessionService } from '../../../../shared/services/active-session.service';
import { ErrorNotificationService } from '../../../../shared/services/error-notification.service';
import { GeolocationService } from '../../../../shared/services/geolocation.service';
import { TravelSessionsService } from '../../../../shared/services/travel-sessions.service';
import { serviceStatusClasses, serviceStatusLabel } from '../../helpers/service-status.helper';
import { PlaceSearchResult } from '../../models/place.model';
import { TravelOption } from '../../models/travel-option.model';
import { PlacesService } from '../../services/places.service';
import { TravelOptionsService } from '../../services/travel-options.service';

@Component({
    selector: 'app-trip-planning-home',
    templateUrl: './trip-planning-home.component.html',
    styleUrl: './trip-planning-home.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripPlanningHomeComponent {
    private readonly placesService = inject(PlacesService);
    private readonly travelOptionsService = inject(TravelOptionsService);
    private readonly travelSessionsService = inject(TravelSessionsService);
    private readonly geolocationService = inject(GeolocationService);
    private readonly activeSessionService = inject(ActiveSessionService);
    private readonly errorNotificationService = inject(ErrorNotificationService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    private readonly destinationQueryChanges = new Subject<string>();

    readonly statusLabel = serviceStatusLabel;
    readonly statusClasses = serviceStatusClasses;

    readonly currentPosition = signal<GeolocationCoordinates | undefined>(undefined);
    readonly locationError = signal<string | undefined>(undefined);

    readonly destinationQuery = signal('');
    readonly destinationResults = signal<PlaceSearchResult[]>([]);
    readonly destinationSearchLoading = signal(false);
    readonly selectedDestination = signal<PlaceSearchResult | undefined>(undefined);

    // undefined = no search run yet; [] = searched, nothing found.
    readonly travelOptions = signal<TravelOption[] | undefined>(undefined);
    readonly travelOptionsLoading = signal(false);

    readonly pendingOption = signal<TravelOption | undefined>(undefined);
    readonly confirmDialogOpen = signal(false);
    readonly creatingSession = signal(false);

    // Contextual error banner (F04's Variant D pattern) — single latest message,
    // manual dismiss, brief slide-down entrance via errorSettled toggling a tick late.
    readonly latestError = signal<string | undefined>(undefined);
    readonly errorSettled = signal(false);

    constructor() {
        this.loadCurrentPosition();

        this.destinationQueryChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                switchMap((query) => {
                    const trimmed = query.trim();
                    if (trimmed.length === 0) {
                        this.destinationSearchLoading.set(false);
                        return of<PlaceSearchResult[]>([]);
                    }
                    this.destinationSearchLoading.set(true);
                    return this.placesService.search(trimmed).pipe(
                        catchError((err: Error) => {
                            this.errorNotificationService.notify(err.message);
                            return of<PlaceSearchResult[]>([]);
                        })
                    );
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((results) => {
                this.destinationSearchLoading.set(false);
                this.destinationResults.set(results);
            });

        this.errorNotificationService.errors$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((message) => {
            this.latestError.set(message);
            this.errorSettled.set(false);
            setTimeout(() => this.errorSettled.set(true));
        });
    }

    retryLocation(): void {
        this.loadCurrentPosition();
    }

    onDestinationInput(value: string): void {
        this.destinationQuery.set(value);
        this.selectedDestination.set(undefined);
        this.travelOptions.set(undefined);
        this.destinationQueryChanges.next(value);
    }

    selectDestination(place: PlaceSearchResult): void {
        this.selectedDestination.set(place);
        this.destinationQuery.set(place.nameTh);
        this.destinationResults.set([]);
        this.searchTravelOptions(place);
    }

    startTrip(option: TravelOption): void {
        this.pendingOption.set(option);
        this.confirmDialogOpen.set(true);
    }

    onConfirmStartTrip(): void {
        const option = this.pendingOption();
        if (!option) {
            return;
        }

        this.creatingSession.set(true);
        this.travelSessionsService
            .create(option.directionId, option.boardingStopId, option.alightingStopId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (session) => {
                    this.creatingSession.set(false);
                    this.confirmDialogOpen.set(false);
                    this.activeSessionService.setActiveSessionId(session.id);
                    this.router.navigate(['/travel-session', session.id]);
                },
                error: (err: Error) => {
                    this.creatingSession.set(false);
                    this.confirmDialogOpen.set(false);
                    this.errorNotificationService.notify(err.message);
                }
            });
    }

    onCancelStartTrip(): void {
        this.confirmDialogOpen.set(false);
        this.pendingOption.set(undefined);
    }

    dismissError(): void {
        this.latestError.set(undefined);
    }

    private loadCurrentPosition(): void {
        this.locationError.set(undefined);
        this.geolocationService
            .getCurrentPosition()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (coords) => this.currentPosition.set(coords),
                error: (err: Error) => this.locationError.set(err.message)
            });
    }

    private searchTravelOptions(destination: PlaceSearchResult): void {
        const position = this.currentPosition();
        if (!position) {
            this.errorNotificationService.notify('ยังไม่ทราบตำแหน่งปัจจุบัน กรุณาลองใหม่อีกครั้ง');
            return;
        }

        this.travelOptionsLoading.set(true);
        this.travelOptionsService
            .search(position.latitude, position.longitude, destination.id, destination.type)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (options) => {
                    this.travelOptionsLoading.set(false);
                    this.travelOptions.set(options);
                },
                error: (err: Error) => {
                    this.travelOptionsLoading.set(false);
                    this.travelOptions.set(undefined);
                    this.errorNotificationService.notify(err.message);
                }
            });
    }
}
