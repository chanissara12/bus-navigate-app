import { TestBed } from '@angular/core/testing';

import { ACTIVE_SESSION_ID_STORAGE_KEY } from '../constants/storage.constant';
import { TravelSessionState } from '../models/travel-session-state.model';
import { ActiveSessionService } from './active-session.service';

describe('ActiveSessionService', () => {
    afterEach(() => {
        localStorage.clear();
    });

    it('has no active session id when nothing was persisted', () => {
        const service = TestBed.inject(ActiveSessionService);

        expect(service.getActiveSessionId()).toBeUndefined();
    });

    it('persists and exposes the active session id when set', () => {
        const service = TestBed.inject(ActiveSessionService);

        service.setActiveSessionId(42);

        expect(service.getActiveSessionId()).toBe(42);
        expect(localStorage.getItem(ACTIVE_SESSION_ID_STORAGE_KEY)).toBe('42');
    });

    it('reads a previously persisted session id set outside this service instance', () => {
        localStorage.setItem(ACTIVE_SESSION_ID_STORAGE_KEY, '7');

        const service = TestBed.inject(ActiveSessionService);

        expect(service.getActiveSessionId()).toBe(7);
    });

    it('clears the active session id', () => {
        const service = TestBed.inject(ActiveSessionService);
        service.setActiveSessionId(42);

        service.clearActiveSessionId();

        expect(service.getActiveSessionId()).toBeUndefined();
        expect(localStorage.getItem(ACTIVE_SESSION_ID_STORAGE_KEY)).toBeNull();
    });

    it.each([TravelSessionState.Completed, TravelSessionState.Abandoned])(
        'clears the active session id when reported state is terminal (%s)',
        (terminalState) => {
            const service = TestBed.inject(ActiveSessionService);
            service.setActiveSessionId(42);

            service.updateFromState(terminalState);

            expect(service.getActiveSessionId()).toBeUndefined();
        }
    );

    it.each([
        TravelSessionState.Planned,
        TravelSessionState.WalkingToStop,
        TravelSessionState.Waiting,
        TravelSessionState.Riding,
        TravelSessionState.Misboarded,
        TravelSessionState.Alighted
    ])('keeps the active session id when reported state is not terminal (%s)', (nonTerminalState) => {
        const service = TestBed.inject(ActiveSessionService);
        service.setActiveSessionId(42);

        service.updateFromState(nonTerminalState);

        expect(service.getActiveSessionId()).toBe(42);
    });
});
