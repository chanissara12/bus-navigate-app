import { PrototypeServiceStatus } from './prototype-mock-data';

export function prototypeStatusLabel(status: PrototypeServiceStatus): string {
    switch (status) {
        case 'Normal':
            return 'ปกติ';
        case 'Delayed':
            return 'ล่าช้า';
        case 'TemporarilySuspended':
            return 'หยุดชั่วคราว';
        case 'Cancelled':
            return 'ยกเลิก';
    }
}

export function prototypeStatusClasses(status: PrototypeServiceStatus): string {
    switch (status) {
        case 'Normal':
            return 'bg-emerald-100 text-emerald-800';
        case 'Delayed':
            return 'bg-amber-100 text-amber-800';
        case 'TemporarilySuspended':
            return 'bg-red-100 text-red-800';
        case 'Cancelled':
            return 'bg-slate-200 text-slate-600';
    }
}
