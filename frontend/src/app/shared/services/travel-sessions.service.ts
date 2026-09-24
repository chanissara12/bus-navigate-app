import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constant';
import { TravelSessionResponse } from '../models/travel-session.model';

@Injectable({ providedIn: 'root' })
export class TravelSessionsService {
    constructor(private readonly http: HttpClient) {}

    create(directionId: number, boardingStopId: number, alightingStopId: number): Observable<TravelSessionResponse> {
        return this.http
            .post<TravelSessionResponse>(`${API_BASE_URL}/travel-sessions`, { directionId, boardingStopId, alightingStopId })
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    const message = err.error?.message ?? err.message ?? 'Failed to create travel session';
                    return throwError(() => new Error(message));
                })
            );
    }
}
