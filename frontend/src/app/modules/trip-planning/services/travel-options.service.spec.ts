import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../shared/constants/api.constant';
import { DataConfidence } from '../../../shared/models/data-confidence.model';
import { PlaceKind } from '../models/place.model';
import { TravelOption } from '../models/travel-option.model';
import { TravelOptionsService } from './travel-options.service';

describe('TravelOptionsService', () => {
    let service: TravelOptionsService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [TravelOptionsService]
        });
        service = TestBed.inject(TravelOptionsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('posts current location and destination, returning the matched travel options', () => {
        const expected: TravelOption[] = [
            {
                directionId: 1,
                routeShortName: '25',
                headsign: 'หัวลำโพง',
                boardingStopId: 10,
                boardingStopNameTh: 'ป้ายบางกะปิ',
                boardingStopNameEn: 'Bang Kapi',
                alightingStopId: 20,
                alightingStopNameTh: 'ป้ายสยาม',
                alightingStopNameEn: 'Siam',
                walkingDistanceMeters: 210,
                dataConfidence: DataConfidence.Scheduled,
                serviceStatus: { transitAlert: undefined, notOperatingToday: false },
                reasons: []
            }
        ];

        service.search(13.7, 100.5, 42, PlaceKind.Place).subscribe((result) => {
            expect(result).toEqual(expected);
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/travel-options`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({
            currentLatitude: 13.7,
            currentLongitude: 100.5,
            destinationPlaceId: 42,
            destinationType: PlaceKind.Place
        });
        req.flush(expected);
    });

    it('maps an HTTP error into an Error with the server message', (done) => {
        service.search(13.7, 100.5, 42, PlaceKind.BusStop).subscribe({
            error: (err: Error) => {
                expect(err.message).toBe('search failed');
                done();
            }
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/travel-options`);
        req.flush({ message: 'search failed' }, { status: 500, statusText: 'Server Error' });
    });
});
