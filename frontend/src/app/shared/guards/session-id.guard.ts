import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// Note: only guards against a missing/malformed :id — there is no backend endpoint
// today that can confirm a TravelSession id actually exists without either a false
// rejection (GET .../progress 400s outside RIDING) or an unwanted side effect
// (POST .../recovery). Redirecting on a real backend 404 is left to the page-level
// data fetch built in F07/F08, which already needs its own error handling.
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

export const sessionIdGuard: CanActivateFn = (route) => {
    const router = inject(Router);
    const id = route.paramMap.get('id');

    return id !== null && POSITIVE_INTEGER_PATTERN.test(id) ? true : router.createUrlTree(['/trip-planning']);
};
