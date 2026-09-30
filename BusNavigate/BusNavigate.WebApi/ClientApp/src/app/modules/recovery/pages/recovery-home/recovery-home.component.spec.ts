import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { RecoveryHomeComponent } from './recovery-home.component';
import { RecoveryModule } from '../../recovery.module';
import { RecoveryOptionKind, RecoveryOptionsResult } from '../../models/recovery-option.model';
import { RecoveryService } from '../../services/recovery.service';
import { GeolocationService } from '../../../../shared/services/geolocation.service';
import { TravelSessionsService } from '../../../../shared/services/travel-sessions.service';
import { ErrorNotificationService } from '../../../../shared/services/error-notification.service';
import { TravelSessionState } from '../../../../shared/models/travel-session-state.model';

describe('RecoveryHomeComponent', () => {
    let component: RecoveryHomeComponent;
    let fixture: ComponentFixture<RecoveryHomeComponent>;
    let recoveryService: { getOptions: jest.Mock };
    let travelSessionsService: { get: jest.Mock; sendEvent: jest.Mock };
    let geolocationService: { getCurrentPosition: jest.Mock };
    let router: { navigate: jest.Mock };

    const recoveryResult: RecoveryOptionsResult = {
        recommendedOptions: [
            {
                kind: RecoveryOptionKind.BusDirection,
                label: 'สาย 8',
                distanceMeters: 180,
                dataConfidence: 2,
                reasons: [{ code: 0, value: null }],
                directionId: 8,
                boardingStopId: 81,
                alightingStopId: 82,
                isCurrentBus: false
            }
        ],
        lastResortOptions: [],
        unconfirmedRailPointers: [
            {
                kind: RecoveryOptionKind.UnconfirmedRailPointer,
                label: 'BTS Siam',
                distanceMeters: 340,
                dataConfidence: 3,
                reasons: [],
                directionId: null,
                boardingStopId: null,
                alightingStopId: null,
                isCurrentBus: false
            }
        ]
    };

    beforeEach(async () => {
        recoveryService = { getOptions: jest.fn().mockReturnValue(of(recoveryResult)) };
        travelSessionsService = {
            get: jest.fn().mockReturnValue(of({
                id: 42,
                state: TravelSessionState.Misboarded,
                directionId: 25,
                boardingStopId: 250,
                alightingStopId: 300,
                walkingDistanceMeters: 120,
                boardingStopNameTh: 'ป้ายขึ้นรถ',
                boardingStopNameEn: 'Boarding Stop',
                alightingStopNameTh: 'ปลายทาง',
                alightingStopNameEn: 'Destination',
                destinationLatitude: 13.75,
                destinationLongitude: 100.52,
                createdAt: '2026-09-25T01:00:00Z',
                lastActivityAt: '2026-09-25T01:10:00Z'
            })),
            sendEvent: jest.fn().mockReturnValue(of({}))
        };
        geolocationService = {
            getCurrentPosition: jest.fn().mockReturnValue(of({
                latitude: 13.7563,
                longitude: 100.5018
            }))
        };
        router = { navigate: jest.fn() };

        await TestBed.configureTestingModule({
            imports: [RecoveryModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ id: '42' })
                        }
                    }
                },
                { provide: Router, useValue: router },
                { provide: RecoveryService, useValue: recoveryService },
                { provide: TravelSessionsService, useValue: travelSessionsService },
                { provide: GeolocationService, useValue: geolocationService },
                { provide: ErrorNotificationService, useValue: { errors$: of() } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RecoveryHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should load recovery options using the route session id and current location', () => {
        expect(travelSessionsService.get).toHaveBeenCalledWith(42);
        expect(recoveryService.getOptions).toHaveBeenCalledWith(42, 13.7563, 100.5018, 25);
        expect(component.recommendedOptions()).toHaveLength(1);
        expect(component.unconfirmedRailPointers()).toHaveLength(1);
    });

    it('exposes the session\'s destination for the walking connector', () => {
        expect(component.destination()).toEqual({ latitude: 13.75, longitude: 100.52 });
    });

    it('should confirm a bus recovery option and navigate back to the travel session', () => {
        const option = component.recommendedOptions()[0];

        component.openConfirmation(option);
        component.confirmRecovery();

        expect(travelSessionsService.sendEvent).toHaveBeenCalledWith(42, 'confirmed_recovery', {
            directionId: 8,
            boardingStopId: 81,
            alightingStopId: 82,
            isCurrentBus: false
        });
        expect(router.navigate).toHaveBeenCalledWith(['/travel-session', 42]);
    });

    it('should not make unconfirmed rail pointers confirmable', () => {
        const option = component.unconfirmedRailPointers()[0];

        component.openConfirmation(option);

        expect(component.dialogOpen()).toBe(false);
        expect(travelSessionsService.sendEvent).not.toHaveBeenCalled();
    });

});
