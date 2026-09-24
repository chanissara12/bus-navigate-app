import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { DataConfidence } from '../../../../shared/models/data-confidence.model';
import { ActiveSessionService } from '../../../../shared/services/active-session.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorNotificationService } from '../../../../shared/services/error-notification.service';
import { GeolocationService } from '../../../../shared/services/geolocation.service';
import { TravelSessionsService } from '../../../../shared/services/travel-sessions.service';
import { PlaceKind, PlaceSearchResult } from '../../models/place.model';
import { TravelOption } from '../../models/travel-option.model';
import { PlacesService } from '../../services/places.service';
import { TravelOptionsService } from '../../services/travel-options.service';
import { TripPlanningHomeComponent } from './trip-planning-home.component';

describe('TripPlanningHomeComponent', () => {
    let fixture: ComponentFixture<TripPlanningHomeComponent>;
    let component: TripPlanningHomeComponent;
    let placesService: { search: jest.Mock };
    let travelOptionsService: { search: jest.Mock };
    let travelSessionsService: { create: jest.Mock };
    let geolocationService: { getCurrentPosition: jest.Mock };
    let activeSessionService: { setActiveSessionId: jest.Mock };
    let router: { navigate: jest.Mock };
    let errorsSubject: Subject<string>;

    const coords = { latitude: 13.7, longitude: 100.5 } as GeolocationCoordinates;
    const place: PlaceSearchResult = {
        id: 42,
        type: PlaceKind.Place,
        nameTh: 'สยามพารากอน',
        nameEn: 'Siam Paragon',
        latitude: 13.74,
        longitude: 100.53
    };
    const option: TravelOption = {
        directionId: 1,
        routeShortName: '25',
        headsign: 'หัวลำโพง',
        boardingStopId: 10,
        boardingStopNameTh: 'ป้ายบางกะปิ',
        boardingStopNameEn: 'Bang Kapi',
        alightingStopId: 20,
        alightingStopNameTh: 'ป้ายสยาม',
        alightingStopNameEn: 'Siam',
        walkingDistanceMeters: 210,
        dataConfidence: DataConfidence.Scheduled,
        serviceStatus: { transitAlert: undefined, notOperatingToday: false },
        reasons: []
    };

    function setup(): void {
        placesService = { search: jest.fn() };
        travelOptionsService = { search: jest.fn() };
        travelSessionsService = { create: jest.fn() };
        geolocationService = { getCurrentPosition: jest.fn().mockReturnValue(of(coords)) };
        activeSessionService = { setActiveSessionId: jest.fn() };
        router = { navigate: jest.fn() };
        errorsSubject = new Subject<string>();

        TestBed.configureTestingModule({
            declarations: [TripPlanningHomeComponent],
            imports: [CommonModule, ConfirmDialogComponent],
            providers: [
                { provide: PlacesService, useValue: placesService },
                { provide: TravelOptionsService, useValue: travelOptionsService },
                { provide: TravelSessionsService, useValue: travelSessionsService },
                { provide: GeolocationService, useValue: geolocationService },
                { provide: ActiveSessionService, useValue: activeSessionService },
                { provide: Router, useValue: router },
                {
                    provide: ErrorNotificationService,
                    useValue: { notify: (m: string) => errorsSubject.next(m), errors$: errorsSubject.asObservable() }
                }
            ]
        });
        fixture = TestBed.createComponent(TripPlanningHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    it('loads the current position on init', () => {
        setup();

        expect(geolocationService.getCurrentPosition).toHaveBeenCalled();
        expect(component.currentPosition()).toBe(coords);
    });

    it('shows a location error and lets the user retry', () => {
        geolocationService = { getCurrentPosition: jest.fn().mockReturnValue(throwError(() => new Error('ปฏิเสธการเข้าถึงตำแหน่ง'))) };
        placesService = { search: jest.fn() };
        travelOptionsService = { search: jest.fn() };
        travelSessionsService = { create: jest.fn() };
        activeSessionService = { setActiveSessionId: jest.fn() };
        router = { navigate: jest.fn() };
        errorsSubject = new Subject<string>();
        TestBed.configureTestingModule({
            declarations: [TripPlanningHomeComponent],
            imports: [CommonModule, ConfirmDialogComponent],
            providers: [
                { provide: PlacesService, useValue: placesService },
                { provide: TravelOptionsService, useValue: travelOptionsService },
                { provide: TravelSessionsService, useValue: travelSessionsService },
                { provide: GeolocationService, useValue: geolocationService },
                { provide: ActiveSessionService, useValue: activeSessionService },
                { provide: Router, useValue: router },
                {
                    provide: ErrorNotificationService,
                    useValue: { notify: (m: string) => errorsSubject.next(m), errors$: errorsSubject.asObservable() }
                }
            ]
        });
        fixture = TestBed.createComponent(TripPlanningHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.locationError()).toBe('ปฏิเสธการเข้าถึงตำแหน่ง');

        geolocationService.getCurrentPosition.mockReturnValue(of(coords));
        component.retryLocation();

        expect(component.currentPosition()).toBe(coords);
        expect(component.locationError()).toBeUndefined();
    });

    it('debounces destination search input before calling PlacesService', fakeAsync(() => {
        setup();
        placesService.search.mockReturnValue(of([place]));

        component.onDestinationInput('สยาม');
        expect(placesService.search).not.toHaveBeenCalled();

        tick(300);

        expect(placesService.search).toHaveBeenCalledWith('สยาม');
        expect(component.destinationResults()).toEqual([place]);
    }));

    it('selecting a destination searches travel options with the current position', fakeAsync(() => {
        setup();
        travelOptionsService.search.mockReturnValue(of([option]));

        component.selectDestination(place);
        tick();

        expect(travelOptionsService.search).toHaveBeenCalledWith(coords.latitude, coords.longitude, place.id, place.type);
        expect(component.travelOptions()).toEqual([option]);
        expect(component.selectedDestination()).toEqual(place);
    }));

    it('notifies an error and does not search when position is not yet known', () => {
        setup();
        component.currentPosition.set(undefined);
        const notified = jest.fn();
        errorsSubject.subscribe(notified);

        component.selectDestination(place);

        expect(travelOptionsService.search).not.toHaveBeenCalled();
        expect(notified).toHaveBeenCalledWith('ยังไม่ทราบตำแหน่งปัจจุบัน กรุณาลองใหม่อีกครั้ง');
    });

    it('renders travel option results as cards with a start-trip button', fakeAsync(() => {
        setup();
        travelOptionsService.search.mockReturnValue(of([option]));

        component.selectDestination(place);
        tick();
        fixture.detectChanges();

        const cardText = fixture.nativeElement.textContent as string;
        expect(cardText).toContain('25');
        expect(cardText).toContain('หัวลำโพง');
        expect(cardText).toContain('ป้ายบางกะปิ');
        expect(fixture.debugElement.query(By.css('[data-testid="start-trip"]'))).not.toBeNull();
    }));

    it('opens the confirm dialog when start trip is clicked', () => {
        setup();

        component.startTrip(option);

        expect(component.confirmDialogOpen()).toBe(true);
        expect(component.pendingOption()).toEqual(option);
    });

    it('creates a travel session and navigates on confirm', () => {
        setup();
        travelSessionsService.create.mockReturnValue(
            of({
                id: 99,
                state: 0,
                directionId: option.directionId,
                boardingStopId: option.boardingStopId,
                alightingStopId: option.alightingStopId,
                createdAt: '2026-09-24T00:00:00Z',
                lastActivityAt: '2026-09-24T00:00:00Z'
            })
        );
        component.startTrip(option);

        component.onConfirmStartTrip();

        expect(travelSessionsService.create).toHaveBeenCalledWith(option.directionId, option.boardingStopId, option.alightingStopId);
        expect(activeSessionService.setActiveSessionId).toHaveBeenCalledWith(99);
        expect(router.navigate).toHaveBeenCalledWith(['/travel-session', 99]);
        expect(component.confirmDialogOpen()).toBe(false);
    });

    it('notifies an error and closes the dialog when session creation fails', () => {
        setup();
        travelSessionsService.create.mockReturnValue(throwError(() => new Error('สร้างทริปไม่สำเร็จ')));
        const notified = jest.fn();
        errorsSubject.subscribe(notified);
        component.startTrip(option);

        component.onConfirmStartTrip();

        expect(component.confirmDialogOpen()).toBe(false);
        expect(router.navigate).not.toHaveBeenCalled();
        expect(notified).toHaveBeenCalledWith('สร้างทริปไม่สำเร็จ');
    });

    it('closes the dialog without creating a session when cancelled', () => {
        setup();
        component.startTrip(option);

        component.onCancelStartTrip();

        expect(component.confirmDialogOpen()).toBe(false);
        expect(component.pendingOption()).toBeUndefined();
        expect(travelSessionsService.create).not.toHaveBeenCalled();
    });

    it('renders and dismisses the contextual error banner reported via ErrorNotificationService', fakeAsync(() => {
        setup();

        errorsSubject.next('เกิดข้อผิดพลาดบางอย่าง');
        tick();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('เกิดข้อผิดพลาดบางอย่าง');

        component.dismissError();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).not.toContain('เกิดข้อผิดพลาดบางอย่าง');
    }));
});
