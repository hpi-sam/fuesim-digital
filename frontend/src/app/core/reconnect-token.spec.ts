import {
    saveReconnectToken,
    getReconnectToken,
    clearReconnectToken,
    clearExpiredTokens,
} from './reconnect-token';

const exerciseKey = 'test-key-123' as any;
const clientId = 'client-uuid-abc' as any;

// localStorage mock for node test environment
function makeLocalStorageMock() {
    let store: { [key: string]: string } = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        get length() {
            return Object.keys(store).length;
        },
        key: (index: number) => Object.keys(store)[index] ?? null,
    };
}

const localStorageMock = makeLocalStorageMock();
Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

describe('reconnect-token', () => {
    beforeEach(() => localStorage.clear());

    it('getReconnectToken returns null when nothing stored', () => {
        expect(getReconnectToken(exerciseKey)).toBeNull();
    });

    it('saveReconnectToken and getReconnectToken roundtrip', () => {
        saveReconnectToken(exerciseKey, clientId);
        expect(getReconnectToken(exerciseKey)).toBe(clientId);
    });

    it('getReconnectToken returns null after clearReconnectToken', () => {
        saveReconnectToken(exerciseKey, clientId);
        clearReconnectToken(exerciseKey);
        expect(getReconnectToken(exerciseKey)).toBeNull();
    });

    it('getReconnectToken returns null for expired entry', () => {
        const entry = { clientId, expiresAt: Date.now() - 1000 };
        localStorage.setItem(`reconnect:${exerciseKey}`, JSON.stringify(entry));
        expect(getReconnectToken(exerciseKey)).toBeNull();
        expect(localStorage.getItem(`reconnect:${exerciseKey}`)).toBeNull();
    });

    it('clearExpiredTokens removes expired entries', () => {
        const expired = { clientId: 'x', expiresAt: Date.now() - 1000 };
        localStorage.setItem('reconnect:expired-key', JSON.stringify(expired));
        saveReconnectToken(exerciseKey, clientId); // valid
        clearExpiredTokens();
        expect(localStorage.getItem('reconnect:expired-key')).toBeNull();
        expect(getReconnectToken(exerciseKey)).toBe(clientId);
    });
});
