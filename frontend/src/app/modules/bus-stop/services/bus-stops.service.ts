import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constant';
import { BusStopContextResult, BusStopSummary } from '../models/bus-stop.model';

@Injectable({ providedIn: 'root' })
export class BusStopsService {
    constructor(private readonly http: HttpClient) {}

    findNearby(latitude: number, longitude: number, radius: number): Observable<BusStopSummary[]> {
        const params = new HttpParams()
            .set('lat', latitude)
            .set('lng', longitude)
            .set('radius', radius);

        return this.http.get<BusStopSummary[]>(`${API_BASE_URL}/bus-stops/nearby`, { params }).pipe(
            catchError((err: HttpErrorResponse) => {
                const message = err.error?.message ?? err.message ?? 'Failed to load nearby bus stops';
                return throwError(() => new Error(message));
            })
        );
    }

    getContext(id: number): Observable<BusStopContextResult> {
        return this.http.get<BusStopContextResult>(`${API_BASE_URL}/bus-stops/${id}`).pipe(
            catchError((err: HttpErrorResponse) => {
                const message = err.error?.message ?? err.message ?? 'Failed to load bus stop context';
                return throwError(() => new Error(message));
            })
        );
    }
}
