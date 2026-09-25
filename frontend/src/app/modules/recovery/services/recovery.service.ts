import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, OperatorFunction, catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constant';
import { RecoveryOptionsResult } from '../models/recovery-option.model';

@Injectable({ providedIn: 'root' })
export class RecoveryService {
    constructor(private readonly http: HttpClient) {}

    getOptions(
        travelSessionId: number,
        currentLatitude: number,
        currentLongitude: number,
        currentDirectionId: number | null
    ): Observable<RecoveryOptionsResult> {
        return this.http
            .post<RecoveryOptionsResult>(
                API_BASE_URL + '/travel-sessions/' + travelSessionId + '/recovery',
                {
                    currentLatitude,
                    currentLongitude,
                    currentDirectionId
                }
            )
            .pipe(this.handleError('Failed to load recovery options'));
    }

    private handleError<T>(fallbackMessage: string): OperatorFunction<T, T> {
        return catchError((err: HttpErrorResponse) => {
            const message = err.error?.message ?? err.message ?? fallbackMessage;
            return throwError(() => new Error(message));
        });
    }
}
