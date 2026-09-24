import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, OperatorFunction, catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constant';
import { TravelSessionProgress } from '../models/travel-session-progress.model';
import { TravelSessionResponse } from '../models/travel-session.model';

@Injectable({ providedIn: 'root' })
export class TravelSessionsService {
    constructor(private readonly http: HttpClient) {}

    create(
        directionId: number,
        boardingStopId: number,
        alightingStopId: number,
        walkingDistanceMeters: number
    ): Observable<TravelSessionResponse> {
        return this.http
            .post<TravelSessionResponse>(API_BASE_URL + '/travel-sessions', {
                directionId,
                boardingStopId,
                alightingStopId,
                walkingDistanceMeters
            })
            .pipe(this.handleError('Failed to create travel session'));
    }

    get(id: number): Observable<TravelSessionResponse> {
        return this.http
            .get<TravelSessionResponse>(API_BASE_URL + '/travel-sessions/' + id)
            .pipe(this.handleError('Failed to load travel session'));
    }

    getProgress(id: number): Observable<TravelSessionProgress> {
        return this.http
            .get<TravelSessionProgress>(API_BASE_URL + '/travel-sessions/' + id + '/progress')
            .pipe(this.handleError('Failed to load travel session progress'));
    }

    sendEvent(id: number, eventType: string): Observable<TravelSessionResponse> {
        return this.http
            .post<TravelSessionResponse>(API_BASE_URL + '/travel-sessions/' + id + '/events', { type: eventType })
            .pipe(this.handleError('Failed to update travel session'));
    }

    private handleError<T>(fallbackMessage: string): OperatorFunction<T, T> {
        return catchError((err: HttpErrorResponse) => {
            const message = err.error?.message ?? err.message ?? fallbackMessage;
            return throwError(() => new Error(message));
        });
    }
}
