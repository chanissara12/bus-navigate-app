import { DataConfidence } from '../../../shared/models/data-confidence.model';
import { ServiceStatusResult } from '../../../shared/models/transit-alert.model';

// Mirrors backend/BusNavigate.Domain/Interfaces/TravelOptionEvaluation/ReasonCode.cs —
// numeric values matter, System.Text.Json serializes the enum as a number.
export enum ReasonCode {
    ReachesDestination = 0,
    DoesNotReachDestination = 1,
    FasterBy = 2,
    SlowerBy = 3,
    NoTransfer = 4,
    ExtraTransferCount = 5,
    ExtraWalkDistance = 6,
    WithinWalkBudget = 7,
    ExceedsWalkBudget = 8
}

// Mirrors .../TravelOptionEvaluation/EvaluationReason.cs.
export interface EvaluationReason {
    code: ReasonCode;
    value: number | null;
}

// Mirrors backend/BusNavigate.Domain/ViewModels/TripPlanning/TravelOption.cs — Phase 1
// is direct-connections only, so there's no transfer/duration/waiting-time field yet.
export interface TravelOption {
    directionId: number;
    routeShortName: string;
    headsign: string;
    boardingStopId: number;
    boardingStopNameTh: string;
    boardingStopNameEn: string;
    alightingStopId: number;
    alightingStopNameTh: string;
    alightingStopNameEn: string;
    walkingDistanceMeters: number;
    dataConfidence: DataConfidence;
    serviceStatus: ServiceStatusResult;
    reasons: EvaluationReason[];
}
