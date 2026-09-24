import { TravelSessionState } from './travel-session-state.model';

// Mirrors backend/BusNavigate.Domain/ViewModels/TravelSession/TravelSessionResponse.cs.
export interface TravelSessionResponse {
    id: number;
    state: TravelSessionState;
    directionId: number;
    boardingStopId: number;
    alightingStopId: number;
    createdAt: string;
    lastActivityAt: string;
}
