// PROTOTYPE — mock data standing in for GET /bus-stops/nearby and
// GET /bus-stops/{id} (T08/T09), read-only.
export type PrototypeLandmarkType = 'Crossing' | 'Skywalk' | 'MallEntrance' | 'Landmark' | 'TransitStationPointer';

export interface PrototypeStopLandmark {
    landmarkType: PrototypeLandmarkType;
    nameTh: string;
    nameEn: string;
    description: string | undefined;
    distanceMeters: number;
}

export interface PrototypeBusStop {
    id: number;
    nameTh: string;
    nameEn: string;
    stopCode: string | undefined;
    distanceMeters: number;
    landmarks: PrototypeStopLandmark[];
}

export const PROTOTYPE_NEARBY_STOPS: PrototypeBusStop[] = [
    {
        id: 1,
        nameTh: 'ป้ายหน้าตลาดบางกะปิ',
        nameEn: 'Bang Kapi Market',
        stopCode: 'BKK-0142',
        distanceMeters: 95,
        landmarks: [
            {
                landmarkType: 'Crossing',
                nameTh: 'ทางม้าลายหน้าตลาด',
                nameEn: 'Zebra crossing at market entrance',
                description: undefined,
                distanceMeters: 20
            },
            {
                landmarkType: 'MallEntrance',
                nameTh: 'ทางเข้าเดอะมอลล์บางกะปิ',
                nameEn: 'The Mall Bang Kapi entrance',
                description: undefined,
                distanceMeters: 140
            },
            {
                landmarkType: 'Landmark',
                nameTh: 'ตู้ ATM ธนาคารกรุงเทพ',
                nameEn: 'Bangkok Bank ATM',
                description: 'อยู่ติดร้านสะดวกซื้อ',
                distanceMeters: 60
            }
        ]
    },
    {
        id: 2,
        nameTh: 'ป้ายแยกลำสาลี',
        nameEn: 'Lam Sali Intersection',
        stopCode: 'BKK-0198',
        distanceMeters: 260,
        landmarks: [
            {
                landmarkType: 'Skywalk',
                nameTh: 'สกายวอล์กข้ามแยกลำสาลี',
                nameEn: 'Lam Sali skywalk',
                description: undefined,
                distanceMeters: 15
            },
            {
                landmarkType: 'TransitStationPointer',
                nameTh: 'สถานีแอร์พอร์ตลิงก์ลำสาลี (ยังไม่ยืนยันข้อมูล)',
                nameEn: 'Lam Sali Airport Rail Link (unconfirmed)',
                description: undefined,
                distanceMeters: 210
            }
        ]
    },
    {
        id: 3,
        nameTh: 'ป้ายหน้าห้างเดอะมอลล์',
        nameEn: 'The Mall Entrance',
        stopCode: undefined,
        distanceMeters: 410,
        landmarks: [
            {
                landmarkType: 'Crossing',
                nameTh: 'ทางข้ามหน้าห้าง',
                nameEn: 'Crossing in front of the mall',
                description: undefined,
                distanceMeters: 25
            }
        ]
    }
];
