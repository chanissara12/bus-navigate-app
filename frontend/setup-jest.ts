import { randomUUID } from 'crypto';

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Note: this jsdom version's Crypto implementation doesn't include randomUUID —
// polyfill it from Node's own crypto module so DeviceIdentityService (which calls the
// standard browser crypto.randomUUID()) works and is spy-able under test.
if (typeof crypto.randomUUID !== 'function') {
    Object.defineProperty(crypto, 'randomUUID', { value: randomUUID, configurable: true, writable: true });
}
