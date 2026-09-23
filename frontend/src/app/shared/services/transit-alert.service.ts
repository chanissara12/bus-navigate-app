import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constant';
import { ServiceStatusResult } from '../models/transit-alert.model';

@Injectable({ providedIn: 'root' })
export class TransitAlertService {
    constructor(private readonly http: HttpClient) {}

    getRouteStatus(routeId: number, directionId?: number): Observable<ServiceStatusResult> {
        let params = new HttpParams();
        if (directionId !== undefined) {
            params = params.set('directionId', directionId);
        }

        return this.http
            .get<ServiceStatusResult>(`${API_BASE_URL}/routes/${routeId}/status`, { params })
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    const message = err.error?.message ?? err.message ?? 'Failed to load route status';
                    return throwError(() => new Error(message));
                })
            );
    }
}
