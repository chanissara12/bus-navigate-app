// PROTOTYPE — small standalone mock data so each variant can render a representative
// "list" (trip-planning-shaped) and "card" (travel-session-shaped) view without
// reaching into another feature module's prototype folder.
export interface DemoListItem {
    routeNumber: string;
    directionName: string;
    boardingStopName: string;
}

export const DEMO_LIST_ITEMS: DemoListItem[] = [
    { routeNumber: '25', directionName: 'ปากน้ำ - หัวลำโพง', boardingStopName: 'ป้ายหน้าตลาดบางกะปิ' },
    { routeNumber: '8', directionName: 'แฮปปี้แลนด์ - สะพานพุทธ', boardingStopName: 'ป้ายแยกลำสาลี' },
    { routeNumber: '48', directionName: 'บางลำพู - ท่าน้ำสี่พระยา', boardingStopName: 'ป้ายหน้าห้างเดอะมอลล์' }
];

export const DEMO_CARD = {
    icon: '🚌',
    label: 'กำลังเดินทาง',
    instruction: 'นั่งสาย 25 อยู่ เหลืออีก 4 ป้ายถึงจุดลง'
};

export const DEMO_ERROR_MESSAGES = [
    'โหลดเส้นทางไม่สำเร็จ ลองใหม่อีกครั้ง',
    'ไม่พบข้อมูลป้ายรถ',
    'การเชื่อมต่อขาดหาย'
];
