// PROTOTYPE — mock data standing in for POST /travel-options (T11), read-only.
export type PrototypeServiceStatus = 'Normal' | 'Delayed' | 'TemporarilySuspended' | 'Cancelled';

export interface PrototypeTravelOption {
    id: string;
    routeNumber: string;
    routeName: string;
    directionName: string;
    boardingStopName: string;
    alightingStopName: string;
    walkingDistanceMeters: number;
    serviceStatus: PrototypeServiceStatus;
}

export const PROTOTYPE_DESTINATION = 'สยามพารากอน';

export const PROTOTYPE_TRAVEL_OPTIONS: PrototypeTravelOption[] = [
    {
        id: 'opt-1',
        routeNumber: '25',
        routeName: 'สาย 25',
        directionName: 'ปากน้ำ - หัวลำโพง',
        boardingStopName: 'ป้ายหน้าตลาดบางกะปิ',
        alightingStopName: 'ป้ายสยามสแควร์',
        walkingDistanceMeters: 210,
        serviceStatus: 'Normal'
    },
    {
        id: 'opt-2',
        routeNumber: '8',
        routeName: 'สาย 8',
        directionName: 'แฮปปี้แลนด์ - สะพานพุทธ',
        boardingStopName: 'ป้ายแยกลำสาลี',
        alightingStopName: 'ป้ายสยามสแควร์วัน',
        walkingDistanceMeters: 480,
        serviceStatus: 'Delayed'
    },
    {
        id: 'opt-3',
        routeNumber: '48',
        routeName: 'สาย 48',
        directionName: 'บางลำพู - ท่าน้ำสี่พระยา',
        boardingStopName: 'ป้ายหน้าห้างเดอะมอลล์',
        alightingStopName: 'ป้ายสยามดิสคัฟเวอรี่',
        walkingDistanceMeters: 120,
        serviceStatus: 'Normal'
    },
    {
        id: 'opt-4',
        routeNumber: '73',
        routeName: 'สาย 73',
        directionName: 'ประเวศ - สนามหลวง',
        boardingStopName: 'ป้ายซอยลาดพร้าว 71',
        alightingStopName: 'ป้ายสยามเซ็นเตอร์',
        walkingDistanceMeters: 650,
        serviceStatus: 'TemporarilySuspended'
    }
];
