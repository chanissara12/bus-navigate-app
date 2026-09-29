import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Optional } from '@angular/core';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constant';

export interface RouteShapePoint {
    sequence: number;
    latitude: number;
    longitude: number;
}

export interface RouteShape {
    directionId: number;
    routeShortName: string;
    headsign: string;
    points: RouteShapePoint[];
}

@Injectable({ providedIn: 'root' })
export class RouteShapesService {
    constructor(@Optional() private readonly http: HttpClient | null) {}

    getAllShapes(): Observable<RouteShape[]> {
        if (!this.http) {
            return throwError(() => new Error('แผนที่ไม่พร้อมใช้งาน'));
        }

        return this.http.get<RouteShape[]>(API_BASE_URL + '/directions/shapes').pipe(
            catchError((err: HttpErrorResponse) => {
                const message = err.error?.message ?? err.message ?? 'Failed to load route shapes';
                return throwError(() => new Error(message));
            })
        );
    }

    getShape(directionId: number): Observable<RouteShapePoint[]> {
        if (!this.http) {
            return throwError(() => new Error('แผนที่ไม่พร้อมใช้งาน'));
        }

        return this.http.get<RouteShapePoint[]>(`${API_BASE_URL}/directions/${directionId}/shape`).pipe(
            catchError((err: HttpErrorResponse) => {
                const message = err.error?.message ?? err.message ?? 'Failed to load route shape';
                return throwError(() => new Error(message));
            })
        );
    }
}
