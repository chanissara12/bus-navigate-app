import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { sessionIdGuard } from './session-id.guard';

describe('sessionIdGuard', () => {
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        router = TestBed.inject(Router);
    });

    function runGuard(id: string | null) {
        const route = {
            paramMap: convertToParamMap(id === null ? {} : { id })
        } as ActivatedRouteSnapshot;

        return TestBed.runInInjectionContext(() => sessionIdGuard(route, {} as RouterStateSnapshot));
    }

    it('allows a valid positive integer id', () => {
        expect(runGuard('42')).toBe(true);
    });

    it('redirects to /trip-planning when the id param is missing', () => {
        expect(runGuard(null)).toEqual(router.createUrlTree(['/trip-planning']));
    });

    it.each(['abc', '0', '-1', '1.5', '', '01'])(
        'redirects to /trip-planning when the id is malformed (%s)',
        (id) => {
            expect(runGuard(id)).toEqual(router.createUrlTree(['/trip-planning']));
        }
    );
});
