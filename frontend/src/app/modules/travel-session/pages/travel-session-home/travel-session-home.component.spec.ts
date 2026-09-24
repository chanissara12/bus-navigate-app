import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';

import { TravelSessionState } from '../../../../shared/models/travel-session-state.model';
import { ActiveSessionService } from '../../../../shared/services/active-session.service';
import { ErrorNotificationService } from '../../../../shared/services/error-notification.service';
import { TravelSessionsService } from '../../../../shared/services/travel-sessions.service';
import { TravelSessionHomeComponent } from './travel-session-home.component';

describe('TravelSessionHomeComponent', () => {
    let component: TravelSessionHomeComponent;
    let fixture: ComponentFixture<TravelSessionHomeComponent>;
    let travelSessionsService: {
        get: jest.Mock;
        sendEvent: jest.Mock;
        getProgress: jest.Mock;
    };
    let activeSessionService: {
        setActiveSessionId: jest.Mock;
        updateFromState: jest.Mock;
    };
    let router: { navigate: jest.Mock };
    let errors$: Subject<string>;

    beforeEach(async () => {
        jest.useFakeTimers();

        travelSessionsService = {
            get: jest.fn().mockReturnValue(of({
                id: 42,
                state: TravelSessionState.Planned,
                directionId: 1,
                boardingStopId: 10,
                alightingStopId: 30,
                walkingDistanceMeters: 210,
                alightingStopNameTh: 'จุดหมายปลายทาง',
                alightingStopNameEn: 'Destination',
                createdAt: '',
                lastActivityAt: ''
            })),
            sendEvent: jest.fn(),
            getProgress: jest.fn().mockReturnValue(of({
                previousStop: { id: 10, nameTh: 'ป้ายก่อนหน้า', nameEn: 'Previous' },
                nextStop: { id: 20, nameTh: 'ป้ายถัดไป', nameEn: 'Next' },
                alightingStop: { id: 30, nameTh: 'จุดลง', nameEn: 'Destination' },
                remainingStopCount: 1,
                isApproachingDestination: true,
                dataConfidence: 1
            }))
        };
        activeSessionService = {
            setActiveSessionId: jest.fn(),
            updateFromState: jest.fn()
        };
        router = { navigate: jest.fn() };
        errors$ = new Subject<string>();

        await TestBed.configureTestingModule({
            imports: [TravelSessionHomeComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: new Map([['id', '42']]) } }
                },
                { provide: Router, useValue: router },
                { provide: TravelSessionsService, useValue: travelSessionsService },
                { provide: ActiveSessionService, useValue: activeSessionService },
                {
                    provide: ErrorNotificationService,
                    useValue: { errors$: errors$.asObservable(), notify: jest.fn() }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TravelSessionHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
        jest.useRealTimers();
    });

    it('reads the route id and persists it as the active session', () => {
        expect(component.sessionId()).toBe(42);
        expect(activeSessionService.setActiveSessionId).toHaveBeenCalledWith(42);
    });

    it('loads the persisted walking distance into the session summary', () => {
        expect(component.walkingDistanceMeters()).toBe(210);
        expect(fixture.nativeElement.textContent).toContain('เดินไปป้ายขึ้นรถประมาณ 210 ม.');
    });


    it('opens confirmation for the state action and sends the matching event', () => {
        travelSessionsService.sendEvent.mockReturnValue(of({
            id: 42,
            state: TravelSessionState.WalkingToStop
        }));

        component.openAdvanceConfirmation();
        expect(component.dialogOpen()).toBe(true);

        component.confirmAction();

        expect(travelSessionsService.sendEvent).toHaveBeenCalledWith(42, 'started_walking');
        expect(component.state()).toBe(TravelSessionState.WalkingToStop);
        expect(component.dialogOpen()).toBe(false);
    });

    it('polls progress after the session enters RIDING', () => {
        travelSessionsService.sendEvent.mockReturnValue(of({
            id: 42,
            state: TravelSessionState.Riding
        }));

        component.state.set(TravelSessionState.Waiting);
        component.openAdvanceConfirmation();
        component.confirmAction();
        jest.advanceTimersByTime(0);

        expect(travelSessionsService.sendEvent).toHaveBeenCalledWith(42, 'boarded');
        expect(travelSessionsService.getProgress).toHaveBeenCalledWith(42);
        expect(component.progress()?.remainingStopCount).toBe(1);
    });

    it('reports a wrong bus and navigates to recovery when the backend returns MISBOARDED', () => {
        travelSessionsService.sendEvent.mockReturnValue(of({
            id: 42,
            state: TravelSessionState.Misboarded
        }));

        component.state.set(TravelSessionState.Riding);
        component.openWrongBusConfirmation();
        component.confirmAction();

        expect(travelSessionsService.sendEvent).toHaveBeenCalledWith(42, 'reported_wrong_bus');
        expect(router.navigate).toHaveBeenCalledWith(['/recovery', 42]);
    });

    it('clears the active session when an event reaches a terminal state', () => {
        travelSessionsService.sendEvent.mockReturnValue(of({
            id: 42,
            state: TravelSessionState.Completed
        }));

        component.state.set(TravelSessionState.Alighted);
        component.openAdvanceConfirmation();
        component.confirmAction();

        expect(activeSessionService.updateFromState).toHaveBeenCalledWith(TravelSessionState.Completed);
    });
});
