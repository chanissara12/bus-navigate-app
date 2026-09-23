import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../constants/api.constant';
import { ServiceStatusResult } from '../models/transit-alert.model';
import { TransitAlertService } from './transit-alert.service';

describe('TransitAlertService', () => {
    let service: TransitAlertService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [TransitAlertService]
        });
        service = TestBed.inject(TransitAlertService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('requests route status without a directionId param when none is given', () => {
        const expected: ServiceStatusResult = { transitAlert: undefined, notOperatingToday: false };

        service.getRouteStatus(1).subscribe((result) => {
            expect(result).toEqual(expected);
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/routes/1/status`);
        expect(req.request.method).toBe('GET');
        expect(req.request.params.has('directionId')).toBe(false);
        req.flush(expected);
    });

    it('includes directionId as a query param when provided', () => {
        const expected: ServiceStatusResult = { transitAlert: undefined, notOperatingToday: true };

        service.getRouteStatus(1, 2).subscribe((result) => {
            expect(result).toEqual(expected);
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/routes/1/status?directionId=2`);
        req.flush(expected);
    });

    it('maps an HTTP error into an Error with the server message', (done) => {
        service.getRouteStatus(1).subscribe({
            error: (err: Error) => {
                expect(err.message).toBe('route not found');
                done();
            }
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/routes/1/status`);
        req.flush({ message: 'route not found' }, { status: 404, statusText: 'Not Found' });
    });
});
