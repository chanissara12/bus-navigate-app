import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constant';
import { PlaceKind } from '../models/place.model';
import { TravelOption } from '../models/travel-option.model';

@Injectable({ providedIn: 'root' })
export class TravelOptionsService {
    constructor(private readonly http: HttpClient) {}

    search(
        currentLatitude: number,
        currentLongitude: number,
        destinationPlaceId: number,
        destinationType: PlaceKind
    ): Observable<TravelOption[]> {
        return this.http
            .post<TravelOption[]>(`${API_BASE_URL}/travel-options`, {
                currentLatitude,
                currentLongitude,
                destinationPlaceId,
                destinationType
            })
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    const message = err.error?.message ?? err.message ?? 'Failed to search travel options';
                    return throwError(() => new Error(message));
                })
            );
    }
}
