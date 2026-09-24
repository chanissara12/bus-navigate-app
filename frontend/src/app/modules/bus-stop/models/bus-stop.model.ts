export interface BusStopSummary {
    id: number;
    nameTh: string;
    nameEn: string;
    stopCode: string | null;
    latitude: number;
    longitude: number;
    distanceMeters: number;
}

export interface BusStopContextResult {
    busStopId: number;
    nameTh: string;
    nameEn: string;
    stopCode: string | null;
    latitude: number;
    longitude: number;
    landmarks: StopLandmark[];
}

export interface StopLandmark {
    landmarkType: number;
    nameTh: string;
    nameEn: string;
    description: string | null;
    distanceMeters: number;
}
