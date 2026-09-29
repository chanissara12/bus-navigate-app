import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DeviceIdentityService } from '../services/device-identity.service';
import { deviceIdInterceptor } from './device-id.interceptor';

describe('deviceIdInterceptor', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: DeviceIdentityService, useValue: { getDeviceId: () => 'device-abc' } }]
        });
    });

    it('attaches the X-Device-Id header to the outgoing request', () => {
        const request = new HttpRequest('GET', '/api/v1/routes/1/status');
        const next = jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));

        TestBed.runInInjectionContext(() => deviceIdInterceptor(request, next).subscribe());

        const forwardedRequest = next.mock.calls[0][0] as HttpRequest<unknown>;
        expect(forwardedRequest.headers.get('X-Device-Id')).toBe('device-abc');
    });

    it('does not mutate the original request object', () => {
        const request = new HttpRequest('GET', '/api/v1/routes/1/status');
        const next = jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));

        TestBed.runInInjectionContext(() => deviceIdInterceptor(request, next).subscribe());

        expect(request.headers.get('X-Device-Id')).toBeNull();
    });
});
