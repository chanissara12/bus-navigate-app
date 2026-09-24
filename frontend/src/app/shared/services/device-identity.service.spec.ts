import { TestBed } from '@angular/core/testing';

import { DEVICE_ID_STORAGE_KEY } from '../constants/storage.constant';
import { DeviceIdentityService } from './device-identity.service';

describe('DeviceIdentityService', () => {
    function spyOnRandomUUID() {
        return jest.spyOn(crypto, 'randomUUID');
    }

    afterEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('generates and persists a new device id on first run', () => {
        spyOnRandomUUID().mockReturnValue('11111111-1111-1111-1111-111111111111');

        const service = TestBed.inject(DeviceIdentityService);

        expect(service.getDeviceId()).toBe('11111111-1111-1111-1111-111111111111');
        expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBe(
            JSON.stringify('11111111-1111-1111-1111-111111111111')
        );
    });

    it('reuses the persisted device id on later runs instead of generating a new one', () => {
        localStorage.setItem(DEVICE_ID_STORAGE_KEY, JSON.stringify('22222222-2222-2222-2222-222222222222'));
        const randomUUID = spyOnRandomUUID();

        const service = TestBed.inject(DeviceIdentityService);

        expect(service.getDeviceId()).toBe('22222222-2222-2222-2222-222222222222');
        expect(randomUUID).not.toHaveBeenCalled();
    });
});
