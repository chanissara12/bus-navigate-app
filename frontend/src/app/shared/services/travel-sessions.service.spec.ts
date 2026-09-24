import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../constants/api.constant';
import { DataConfidence } from '../models/data-confidence.model';
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

    const session: TravelSessionResponse = {
        id: 7,
        state: TravelSessionState.Planned,
        directionId: 1,
        boardingStopId: 10,
        alightingStopId: 20,
        walkingDistanceMeters: 210,
        createdAt: '2026-09-24T00:00:00Z',
        lastActivityAt: '2026-09-24T00:00:00Z'
    };

    it('creates a travel session from a chosen direction/boarding/alighting stop', () => {
        service.create(1, 10, 20, 210).subscribe((result) => {
            expect(result).toEqual(session);
        });

        const req = httpMock.expectOne(API_BASE_URL + '/travel-sessions');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({
            directionId: 1,
            boardingStopId: 10,
            alightingStopId: 20,
            walkingDistanceMeters: 210
        });
        req.flush(session);
    });

    it('loads travel session progress', () => {
        service.getProgress(7).subscribe((result) => {
            expect(result.remainingStopCount).toBe(1);
            expect(result.isApproachingDestination).toBe(true);
            expect(result.dataConfidence).toBe(DataConfidence.Estimated);
        });

        const req = httpMock.expectOne(API_BASE_URL + '/travel-sessions/7/progress');
        expect(req.request.method).toBe('GET');
        req.flush({
            previousStop: { id: 10, nameTh: 'ป้ายก่อนหน้า', nameEn: 'Previous' },
            nextStop: { id: 20, nameTh: 'ป้ายถัดไป', nameEn: 'Next' },
            alightingStop: { id: 30, nameTh: 'จุดลง', nameEn: 'Destination' },
            remainingStopCount: 1,
            isApproachingDestination: true,
            dataConfidence: DataConfidence.Estimated
        });
    });

    it('sends a travel session event', () => {
        service.sendEvent(7, 'boarded').subscribe((result) => {
            expect(result).toEqual(session);
        });

        const req = httpMock.expectOne(API_BASE_URL + '/travel-sessions/7/events');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ type: 'boarded' });
        req.flush(session);
    });

    it('maps an HTTP error into an Error with the server message', (done) => {
        service.sendEvent(7, 'boarded').subscribe({
            error: (err: Error) => {
                expect(err.message).toBe('could not update session');
                done();
            }
        });

        const req = httpMock.expectOne(API_BASE_URL + '/travel-sessions/7/events');
        req.flush({ message: 'could not update session' }, { status: 400, statusText: 'Bad Request' });
    });
});
