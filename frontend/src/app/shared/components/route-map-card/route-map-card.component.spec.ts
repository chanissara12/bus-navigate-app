import { TestBed } from '@angular/core/testing';

import { RouteMapCardComponent } from './route-map-card.component';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrivateApi = any;

describe('RouteMapCardComponent calculation logic', () => {
    let component: PrivateApi;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [RouteMapCardComponent] });
        // Never call fixture.detectChanges() here: ngAfterViewInit() would create a
        // real Leaflet map against the #mapHost div, which this suite doesn't need
        // since it only exercises the component's pure geometry/calculation methods.
        component = TestBed.createComponent(RouteMapCardComponent).componentInstance;
    });

    describe('getGpsStatus', () => {
        it('reports searching when accuracy is unknown', () => {
            expect(component.getGpsStatus(undefined)).toBe('กำลังค้นหาตำแหน่ง…');
        });

        it('reports weak signal above 100m', () => {
            expect(component.getGpsStatus(150)).toBe('สัญญาณ GPS อ่อน · กำลังรอค่าที่แม่นขึ้น');
        });

        it('reports adjusting between 50m and 100m', () => {
            expect(component.getGpsStatus(75)).toBe('กำลังปรับตำแหน่ง GPS…');
        });

        it('reports usable between 20m and 50m', () => {
            expect(component.getGpsStatus(30)).toBe('GPS ใช้งานได้');
        });

        it('reports accurate at 20m or below', () => {
            expect(component.getGpsStatus(10)).toBe('GPS แม่นยำ');
        });
    });

    describe('getSmoothedPosition', () => {
        function coords(latitude: number, longitude: number, accuracy: number): GeolocationCoordinates {
            return { latitude, longitude, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null };
        }

        it('returns the single reading unchanged when only one position was recorded', () => {
            component.recentPositions = [coords(13.69, 100.5, 20)];

            const smoothed = component.getSmoothedPosition();

            expect(smoothed.latitude).toBe(13.69);
            expect(smoothed.longitude).toBe(100.5);
        });

        it('weighs the more accurate reading more heavily', () => {
            component.recentPositions = [
                coords(13.69, 100.5, 5), // most accurate: pulls the average closest to it
                coords(13.70, 100.5, 100)
            ];

            const smoothed = component.getSmoothedPosition();

            expect(smoothed.latitude).toBeLessThan(13.695);
            expect(smoothed.latitude).toBeGreaterThan(13.69);
        });
    });
});
