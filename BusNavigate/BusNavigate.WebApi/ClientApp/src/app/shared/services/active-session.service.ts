import { Injectable } from '@angular/core';

import { ACTIVE_SESSION_ID_STORAGE_KEY } from '../constants/storage.constant';
import { readLocalStorage, removeLocalStorage, writeLocalStorage } from '../helpers/local-storage.helper';
import { isTerminalTravelSessionState, TravelSessionState } from '../models/travel-session-state.model';

// Note: separate lifecycle from DeviceIdentityService — a device id is permanent, this
// id is per-trip and clears itself once the session reaches a terminal state.
@Injectable({ providedIn: 'root' })
export class ActiveSessionService {
    getActiveSessionId(): number | undefined {
        return readLocalStorage<number>(ACTIVE_SESSION_ID_STORAGE_KEY);
    }

    setActiveSessionId(sessionId: number): void {
        writeLocalStorage(ACTIVE_SESSION_ID_STORAGE_KEY, sessionId);
    }

    clearActiveSessionId(): void {
        removeLocalStorage(ACTIVE_SESSION_ID_STORAGE_KEY);
    }

    // Called by pages that just read a session's state (event response, progress read)
    // — clears the persisted active session once it reaches COMPLETED/ABANDONED.
    updateFromState(state: TravelSessionState): void {
        if (isTerminalTravelSessionState(state)) {
            this.clearActiveSessionId();
        }
    }
}
