// PROTOTYPE — mock data standing in for POST /travel-sessions/{id}/recovery (T06/T09,
// RecoveryOptionsResult), read-only.
export type PrototypeRecoveryKind = 'BusDirection' | 'UnconfirmedRailPointer';
export type PrototypeDataConfidence = 'Realtime' | 'Estimated' | 'Scheduled' | 'Unknown';

export interface PrototypeRecoveryOption {
    id: string;
    kind: PrototypeRecoveryKind;
    label: string;
    isCurrentBus: boolean;
    distanceMeters: number;
    dataConfidence: PrototypeDataConfidence;
    reasons: string[];
}

export const PROTOTYPE_RECOMMENDED: PrototypeRecoveryOption[] = [
    {
        id: 'rec-1',
        kind: 'BusDirection',
        label: 'สาย 8 (แฮปปี้แลนด์ - สะพานพุทธ)',
        isCurrentBus: false,
        distanceMeters: 180,
        dataConfidence: 'Scheduled',
        reasons: ['ถึงจุดหมายได้', 'อยู่ในระยะเดินที่กำหนด']
    },
    {
        id: 'rec-2',
        kind: 'BusDirection',
        label: 'สาย 25 (ปากน้ำ - หัวลำโพง)',
        isCurrentBus: true,
        distanceMeters: 0,
        dataConfidence: 'Scheduled',
        reasons: ['ถึงจุดหมายได้', 'ไม่ต้องเดินเพิ่ม']
    }
];

export const PROTOTYPE_LAST_RESORT: PrototypeRecoveryOption[] = [
    {
        id: 'last-1',
        kind: 'BusDirection',
        label: 'สาย 48 (บางลำพู - ท่าน้ำสี่พระยา)',
        isCurrentBus: false,
        distanceMeters: 650,
        dataConfidence: 'Scheduled',
        reasons: ['ถึงจุดหมายได้', 'เดินเกินระยะที่กำหนด']
    }
];

export const PROTOTYPE_UNCONFIRMED_RAIL: PrototypeRecoveryOption[] = [
    {
        id: 'rail-1',
        kind: 'UnconfirmedRailPointer',
        label: 'สถานีแอร์พอร์ตลิงก์ลำสาลี',
        isCurrentBus: false,
        distanceMeters: 340,
        dataConfidence: 'Unknown',
        reasons: []
    }
];
