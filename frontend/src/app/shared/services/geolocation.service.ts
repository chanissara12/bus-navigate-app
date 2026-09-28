import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
    private readonly positionOptions: PositionOptions = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
    };

    getCurrentPosition(): Observable<GeolocationCoordinates> {
        return new Observable((subscriber) => {
            if (!navigator.geolocation) {
                subscriber.error(new Error('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => subscriber.next(position.coords),
                (error) => subscriber.error(new Error(this.messageForError(error))),
                this.positionOptions
            );
        });
    }

    watchPosition(): Observable<GeolocationCoordinates> {
        return new Observable((subscriber) => {
            if (!navigator.geolocation) {
                subscriber.error(new Error('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง'));
                return;
            }

            const watchId = navigator.geolocation.watchPosition(
                (position) => subscriber.next(position.coords),
                (error) => subscriber.error(new Error(this.messageForError(error))),
                this.positionOptions
            );

            return () => navigator.geolocation.clearWatch(watchId);
        });
    }

    private messageForError(error: GeolocationPositionError): string {
        if (error.code === error.PERMISSION_DENIED) {
            return 'กรุณาอนุญาตการเข้าถึงตำแหน่งเพื่อค้นหาเส้นทาง';
        }
        if (error.code === error.TIMEOUT) {
            return 'ใช้เวลาระบุตำแหน่งนานเกินไป ลองใหม่อีกครั้ง';
        }
        return 'ไม่สามารถระบุตำแหน่งได้ ลองใหม่อีกครั้ง';
    }
}
