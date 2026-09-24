import { TestBed } from '@angular/core/testing';

import { GeolocationService } from './geolocation.service';

describe('GeolocationService', () => {
    let service: GeolocationService;
    let originalGeolocation: Geolocation | undefined;

    beforeEach(() => {
        originalGeolocation = navigator.geolocation;
        service = TestBed.inject(GeolocationService);
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'geolocation', { value: originalGeolocation, configurable: true });
    });

    it('emits the current position coordinates on success', (done) => {
        const coords = { latitude: 13.75, longitude: 100.5 } as GeolocationCoordinates;
        Object.defineProperty(navigator, 'geolocation', {
            configurable: true,
            value: {
                getCurrentPosition: (success: PositionCallback) => success({ coords } as GeolocationPosition)
            }
        });

        service.getCurrentPosition().subscribe((result) => {
            expect(result).toBe(coords);
            done();
        });
    });

    it('errors with a friendly message when the browser denies permission', (done) => {
        Object.defineProperty(navigator, 'geolocation', {
            configurable: true,
            value: {
                getCurrentPosition: (_: PositionCallback, error: PositionErrorCallback) =>
                    error({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError)
            }
        });

        service.getCurrentPosition().subscribe({
            error: (err: Error) => {
                expect(err.message).toBe('กรุณาอนุญาตการเข้าถึงตำแหน่งเพื่อค้นหาเส้นทาง');
                done();
            }
        });
    });

    it('errors with a friendly message when geolocation is unsupported', (done) => {
        Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });

        service.getCurrentPosition().subscribe({
            error: (err: Error) => {
                expect(err.message).toBe('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง');
                done();
            }
        });
    });
});
