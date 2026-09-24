import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
    getCurrentPosition(): Observable<GeolocationCoordinates> {
        return new Observable((subscriber) => {
            if (!navigator.geolocation) {
                subscriber.error(new Error('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    subscriber.next(position.coords);
                    subscriber.complete();
                },
                (error) => {
                    subscriber.error(new Error(this.messageForError(error)));
                }
            );
        });
    }

    private messageForError(error: GeolocationPositionError): string {
        if (error.code === error.PERMISSION_DENIED) {
            return 'กรุณาอนุญาตการเข้าถึงตำแหน่งเพื่อค้นหาเส้นทาง';
        }
        return 'ไม่สามารถระบุตำแหน่งได้ ลองใหม่อีกครั้ง';
    }
}
