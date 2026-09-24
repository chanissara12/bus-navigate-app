import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { BusStopModule } from '../../bus-stop.module';
import { BusStopHomeComponent } from './bus-stop-home.component';
import { BusStopsService } from '../../services/bus-stops.service';
import { GeolocationService } from '../../../../shared/services/geolocation.service';
import { ErrorNotificationService } from '../../../../shared/services/error-notification.service';

describe('BusStopHomeComponent', () => {
    let component: BusStopHomeComponent;
    let fixture: ComponentFixture<BusStopHomeComponent>;
    let busStopsService: {
        findNearby: jest.Mock;
        getContext: jest.Mock;
    };

    beforeEach(async () => {
        busStopsService = {
            findNearby: jest.fn().mockReturnValue(of([])),
            getContext: jest.fn()
        };

        await TestBed.configureTestingModule({
            imports: [BusStopModule],
            providers: [
                { provide: BusStopsService, useValue: busStopsService },
                {
                    provide: GeolocationService,
                    useValue: {
                        getCurrentPosition: jest.fn().mockReturnValue(
                            of({ latitude: 13.75, longitude: 100.5 } as GeolocationCoordinates)
                        )
                    }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BusStopHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('loads nearby stops from the current position', () => {
        expect(busStopsService.findNearby).toHaveBeenCalledWith(13.75, 100.5, 1000);
    });

    it('loads landmark context when a stop is expanded', () => {
        const context = {
            busStopId: 1,
            nameTh: 'ป้าย',
            nameEn: 'Stop',
            stopCode: null,
            latitude: 13.75,
            longitude: 100.5,
            landmarks: []
        };
        busStopsService.getContext.mockReturnValue(of(context));

        component.toggle({
            id: 1,
            nameTh: 'ป้าย',
            nameEn: 'Stop',
            stopCode: null,
            latitude: 13.75,
            longitude: 100.5,
            distanceMeters: 100
        });

        expect(busStopsService.getContext).toHaveBeenCalledWith(1);
        expect(component.expandedContext()).toEqual(context);
    });

    it('collapses the expanded stop without another request', () => {
        busStopsService.getContext.mockReturnValue(of({
            busStopId: 1,
            nameTh: 'ป้าย',
            nameEn: 'Stop',
            stopCode: null,
            latitude: 13.75,
            longitude: 100.5,
            landmarks: []
        }));

        const stop = {
            id: 1,
            nameTh: 'ป้าย',
            nameEn: 'Stop',
            stopCode: null,
            latitude: 13.75,
            longitude: 100.5,
            distanceMeters: 100
        };

        component.toggle(stop);
        component.toggle(stop);

        expect(component.expandedId()).toBeUndefined();
        expect(busStopsService.getContext).toHaveBeenCalledTimes(1);
    });

    it('reports nearby-load errors through the error notification service', () => {
        const notificationService = TestBed.inject(ErrorNotificationService);
        const notifySpy = jest.spyOn(notificationService, 'notify');
        busStopsService.findNearby.mockReturnValue(throwError(() => new Error('network failed')));

        component['loadNearbyStops']({ latitude: 13.75, longitude: 100.5 } as GeolocationCoordinates);

        expect(notifySpy).toHaveBeenCalledWith('network failed');
    });
});
