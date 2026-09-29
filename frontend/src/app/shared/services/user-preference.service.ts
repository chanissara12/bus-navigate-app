import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, OperatorFunction, catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constant';
import { UserPreference, UserPreferenceToggles } from '../models/user-preference.model';

@Injectable({ providedIn: 'root' })
export class UserPreferenceService {
    constructor(private readonly http: HttpClient) {}

    get(): Observable<UserPreference> {
        return this.http
            .get<UserPreference>(API_BASE_URL + '/user-preferences')
            .pipe(this.handleError('Failed to load preferences'));
    }

    save(toggles: UserPreferenceToggles): Observable<UserPreference> {
        return this.http
            .put<UserPreference>(API_BASE_URL + '/user-preferences', toggles)
            .pipe(this.handleError('Failed to save preferences'));
    }

    private handleError<T>(fallbackMessage: string): OperatorFunction<T, T> {
        return catchError((err: HttpErrorResponse) => {
            const message = err.error?.message ?? err.message ?? fallbackMessage;
            return throwError(() => new Error(message));
        });
    }
}
