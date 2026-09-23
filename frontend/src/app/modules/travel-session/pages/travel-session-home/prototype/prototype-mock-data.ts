// PROTOTYPE — mock data standing in for the TravelSession state machine (T04) and
// GET /travel-sessions/{id}/progress (T09/TravelSessionProgress), read-only.
export type PrototypeSessionState =
    | 'Planned'
    | 'WalkingToStop'
    | 'Waiting'
    | 'Riding'
    | 'Misboarded'
    | 'Alighted'
    | 'Completed';

export interface PrototypeStateInfo {
    state: PrototypeSessionState;
    label: string;
    instruction: string;
    icon: string;
}

export const PROTOTYPE_STATES: PrototypeStateInfo[] = [
    { state: 'Planned', label: 'วางแผนแล้ว', instruction: 'เตรียมตัวออกเดินทาง', icon: '🗺️' },
    { state: 'WalkingToStop', label: 'กำลังเดินไปป้าย', instruction: 'เดินไปป้ายหน้าตลาดบางกะปิ อีก 210 ม.', icon: '🚶' },
    { state: 'Waiting', label: 'รอรถ', instruction: 'รอรถสาย 25 (ปากน้ำ - หัวลำโพง)', icon: '⏳' },
    { state: 'Riding', label: 'กำลังเดินทาง', instruction: 'นั่งสาย 25 อยู่ เหลืออีก 4 ป้ายถึงจุดลง', icon: '🚌' },
    { state: 'Misboarded', label: 'ขึ้นรถผิดคัน', instruction: 'ดูเหมือนคุณขึ้นรถผิดสาย — ดูทางเลือกแก้ไข', icon: '⚠️' },
    { state: 'Alighted', label: 'ลงรถแล้ว', instruction: 'ลงที่ป้ายสยามสแควร์แล้ว เดินต่อไปยังจุดหมาย', icon: '🏁' },
    { state: 'Completed', label: 'ถึงจุดหมายแล้ว', instruction: 'เดินทางถึงสยามพารากอนเรียบร้อย', icon: '✅' }
];

// Get-off assistance — a computed value within RIDING, not its own state (T04).
export const PROTOTYPE_PROGRESS = {
    remainingStopCount: 1,
    isApproachingDestination: true
};

export function prototypeStateInfo(state: PrototypeSessionState): PrototypeStateInfo {
    return PROTOTYPE_STATES.find((s) => s.state === state) ?? PROTOTYPE_STATES[0];
}
