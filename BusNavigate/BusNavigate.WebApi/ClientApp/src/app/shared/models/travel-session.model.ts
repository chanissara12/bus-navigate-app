import { TravelSessionState } from './travel-session-state.model';

// Mirrors BusNavigate/BusNavigate.Domain/ViewModels/TravelSession/TravelSessionResponse.cs.
export interface TravelSessionResponse {
    id: number;
    state: TravelSessionState;
    directionId: number;
    boardingStopId: number;
    alightingStopId: number;
    walkingDistanceMeters: number;
    boardingStopNameTh: string;
    boardingStopNameEn: string;
    alightingStopNameTh: string;
    alightingStopNameEn: string;
    destinationLatitude: number;
    destinationLongitude: number;
    createdAt: string;
    lastActivityAt: string;
}
