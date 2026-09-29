// Note: shared by DeviceIdentityService and ActiveSessionService — same small
// read/write wrapper, different keys and lifecycles (see each service).
export function readLocalStorage<T>(key: string): T | undefined {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? undefined : (JSON.parse(raw) as T);
    } catch {
        return undefined;
    }
}

export function writeLocalStorage<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Note: localStorage can throw (quota exceeded, private-mode restrictions) —
        // persistence here is best-effort, not a required guarantee.
    }
}

export function removeLocalStorage(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        // Note: see writeLocalStorage — best-effort.
    }
}
