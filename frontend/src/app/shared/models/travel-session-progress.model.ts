import { DataConfidence } from './data-confidence.model';

export interface TravelStopSummary {
    id: number;
    nameTh: string;
    nameEn: string;
}

export interface TravelSessionProgress {
    previousStop: TravelStopSummary | null;
    nextStop: TravelStopSummary | null;
    alightingStop: TravelStopSummary;
    remainingStopCount: number;
    isApproachingDestination: boolean;
    dataConfidence: DataConfidence;
}
