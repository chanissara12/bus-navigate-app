import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { DeviceIdentityService } from '../services/device-identity.service';

export const deviceIdInterceptor: HttpInterceptorFn = (request, next) => {
    const deviceIdentityService = inject(DeviceIdentityService);
    const requestWithDeviceId = request.clone({
        setHeaders: { 'X-Device-Id': deviceIdentityService.getDeviceId() }
    });

    return next(requestWithDeviceId);
};
