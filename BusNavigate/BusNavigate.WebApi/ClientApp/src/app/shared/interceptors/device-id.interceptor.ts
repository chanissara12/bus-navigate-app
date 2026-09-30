import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL } from '../constants/api.constant';
import { DeviceIdentityService } from '../services/device-identity.service';

// Only our own API needs to know the device — never leak it to a third-party request
// (e.g. the OSRM walking-route lookup) just because it shares an HttpClient instance.
export const deviceIdInterceptor: HttpInterceptorFn = (request, next) => {
    if (!request.url.startsWith(API_BASE_URL)) {
        return next(request);
    }

    const deviceIdentityService = inject(DeviceIdentityService);
    const requestWithDeviceId = request.clone({
        setHeaders: { 'X-Device-Id': deviceIdentityService.getDeviceId() }
    });

    return next(requestWithDeviceId);
};
