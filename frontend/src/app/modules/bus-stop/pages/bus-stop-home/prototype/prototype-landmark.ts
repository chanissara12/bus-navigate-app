import { PrototypeLandmarkType } from './prototype-mock-data';

export function prototypeLandmarkIcon(type: PrototypeLandmarkType): string {
    switch (type) {
        case 'Crossing':
            return '🚸';
        case 'Skywalk':
            return '🌉';
        case 'MallEntrance':
            return '🏬';
        case 'Landmark':
            return '📍';
        case 'TransitStationPointer':
            return '🚉';
    }
}

export function prototypeLandmarkLabel(type: PrototypeLandmarkType): string {
    switch (type) {
        case 'Crossing':
            return 'ทางข้าม';
        case 'Skywalk':
            return 'สกายวอล์ก';
        case 'MallEntrance':
            return 'ทางเข้าห้าง';
        case 'Landmark':
            return 'จุดสังเกต';
        case 'TransitStationPointer':
            return 'สถานีรถไฟฟ้า (ยังไม่ยืนยัน)';
    }
}
