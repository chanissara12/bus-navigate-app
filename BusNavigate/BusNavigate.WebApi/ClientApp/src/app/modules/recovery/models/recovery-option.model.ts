import { DataConfidence } from '../../../shared/models/data-confidence.model';
import { EvaluationReason } from '../../trip-planning/models/travel-option.model';

export enum RecoveryOptionKind {
    BusDirection = 0,
    UnconfirmedRailPointer = 1
}

export interface RecoveryOption {
    kind: RecoveryOptionKind;
    label: string;
    distanceMeters: number;
    dataConfidence: DataConfidence;
    reasons: EvaluationReason[];
    directionId: number | null;
    boardingStopId: number | null;
    alightingStopId: number | null;
    isCurrentBus: boolean;
}

export interface RecoveryOptionsResult {
    recommendedOptions: RecoveryOption[];
    lastResortOptions: RecoveryOption[];
    unconfirmedRailPointers: RecoveryOption[];
}
