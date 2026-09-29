import { Injectable } from '@angular/core';

import { DEVICE_ID_STORAGE_KEY } from '../constants/storage.constant';
import { readLocalStorage, writeLocalStorage } from '../helpers/local-storage.helper';

@Injectable({ providedIn: 'root' })
export class DeviceIdentityService {
    private readonly deviceId: string;

    constructor() {
        const existing = readLocalStorage<string>(DEVICE_ID_STORAGE_KEY);
        if (existing) {
            this.deviceId = existing;
        } else {
            this.deviceId = crypto.randomUUID();
            writeLocalStorage(DEVICE_ID_STORAGE_KEY, this.deviceId);
        }
    }

    getDeviceId(): string {
        return this.deviceId;
    }
}
