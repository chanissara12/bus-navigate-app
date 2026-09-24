import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../shared/constants/api.constant';
import { PlaceKind, PlaceSearchResult } from '../models/place.model';
import { PlacesService } from './places.service';

describe('PlacesService', () => {
    let service: PlacesService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [PlacesService]
        });
        service = TestBed.inject(PlacesService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('searches places by query text', () => {
        const expected: PlaceSearchResult[] = [
            { id: 1, type: PlaceKind.BusStop, nameTh: 'ป้ายสยาม', nameEn: 'Siam Stop', latitude: 13.74, longitude: 100.53 }
        ];

        service.search('สยาม').subscribe((result) => {
            expect(result).toEqual(expected);
        });

        const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/places/search`);
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('q')).toBe('สยาม');
        req.flush(expected);
    });

    it('maps an HTTP error into an Error with the server message', (done) => {
        service.search('สยาม').subscribe({
            error: (err: Error) => {
                expect(err.message).toBe('search failed');
                done();
            }
        });

        const req = httpMock.expectOne((r) => r.url === `${API_BASE_URL}/places/search`);
        req.flush({ message: 'search failed' }, { status: 500, statusText: 'Server Error' });
    });
});
