import { readLocalStorage, removeLocalStorage, writeLocalStorage } from './local-storage.helper';

describe('local-storage helper', () => {
    afterEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    it('returns undefined when the key is not set', () => {
        expect(readLocalStorage('missing-key')).toBeUndefined();
    });

    it('round-trips a value written and then read', () => {
        writeLocalStorage('device-id', 'abc-123');

        expect(readLocalStorage<string>('device-id')).toBe('abc-123');
    });

    it('round-trips a non-string value', () => {
        writeLocalStorage('session', { id: 42 });

        expect(readLocalStorage<{ id: number }>('session')).toEqual({ id: 42 });
    });

    it('removes a stored value', () => {
        writeLocalStorage('device-id', 'abc-123');

        removeLocalStorage('device-id');

        expect(readLocalStorage('device-id')).toBeUndefined();
    });

    it('returns undefined when the stored value is not valid JSON', () => {
        localStorage.setItem('corrupt', '{not-json');

        expect(readLocalStorage('corrupt')).toBeUndefined();
    });

    it('does not throw when localStorage.getItem throws', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked');
        });

        expect(readLocalStorage('device-id')).toBeUndefined();
    });

    it('does not throw when localStorage.setItem throws', () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('quota exceeded');
        });

        expect(() => writeLocalStorage('device-id', 'abc-123')).not.toThrow();
    });

    it('does not throw when localStorage.removeItem throws', () => {
        jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new Error('blocked');
        });

        expect(() => removeLocalStorage('device-id')).not.toThrow();
    });
});
