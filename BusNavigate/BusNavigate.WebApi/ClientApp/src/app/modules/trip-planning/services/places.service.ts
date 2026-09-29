import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constant';
import { PlaceSearchResult } from '../models/place.model';

@Injectable({ providedIn: 'root' })
export class PlacesService {
    constructor(private readonly http: HttpClient) {}

    search(query: string): Observable<PlaceSearchResult[]> {
        const params = new HttpParams().set('q', query);

        return this.http.get<PlaceSearchResult[]>(`${API_BASE_URL}/places/search`, { params }).pipe(
            catchError((err: HttpErrorResponse) => {
                const message = err.error?.message ?? err.message ?? 'Failed to search places';
                return throwError(() => new Error(message));
            })
        );
    }
}
