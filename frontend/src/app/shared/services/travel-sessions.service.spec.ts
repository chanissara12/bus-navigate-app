import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../constants/api.constant';
import { TravelSessionState } from '../models/travel-session-state.model';
import { TravelSessionResponse } from '../models/travel-session.model';
import { TravelSessionsService } from './travel-sessions.service';

describe('TravelSessionsService', () => {
    let service: TravelSessionsService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [TravelSessionsService]
        });
        service = TestBed.inject(TravelSessionsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('creates a travel session from a chosen direction/boarding/alighting stop', () => {
        const expected: TravelSessionResponse = {
            id: 7,
            state: TravelSessionState.Planned,
            directionId: 1,
            boardingStopId: 10,
            alightingStopId: 20,
            createdAt: '2026-09-24T00:00:00Z',
            lastActivityAt: '2026-09-24T00:00:00Z'
        };

        service.create(1, 10, 20).subscribe((result) => {
            expect(result).toEqual(expected);
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/travel-sessions`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ directionId: 1, boardingStopId: 10, alightingStopId: 20 });
        req.flush(expected);
    });

    it('maps an HTTP error into an Error with the server message', (done) => {
        service.create(1, 10, 20).subscribe({
            error: (err: Error) => {
                expect(err.message).toBe('could not create session');
                done();
            }
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/travel-sessions`);
        req.flush({ message: 'could not create session' }, { status: 400, statusText: 'Bad Request' });
    });
});
