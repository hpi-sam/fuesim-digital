import type { ExerciseKey, UUID } from 'fuesim-digital-shared';

const expiryMs = 60 * 60 * 1000; // 1 hour
const keyPrefix = 'reconnect:';

interface ReconnectEntry {
    clientId: UUID;
    expiresAt: number;
}

export function saveReconnectToken(
    exerciseKey: ExerciseKey,
    clientId: UUID
): void {
    const entry: ReconnectEntry = {
        clientId,
        expiresAt: Date.now() + expiryMs,
    };
    localStorage.setItem(`${keyPrefix}${exerciseKey}`, JSON.stringify(entry));
}

export function getReconnectToken(exerciseKey: ExerciseKey): UUID | null {
    const raw = localStorage.getItem(`${keyPrefix}${exerciseKey}`);
    if (!raw) return null;
    let entry: ReconnectEntry;
    try {
        entry = JSON.parse(raw) as ReconnectEntry;
    } catch {
        clearReconnectToken(exerciseKey);
        return null;
    }
    if (Date.now() > entry.expiresAt) {
        clearReconnectToken(exerciseKey);
        return null;
    }
    return entry.clientId;
}

export function clearReconnectToken(exerciseKey: ExerciseKey): void {
    localStorage.removeItem(`${keyPrefix}${exerciseKey}`);
}

export function clearExpiredTokens(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(keyPrefix)) {
            const raw = localStorage.getItem(key);
            if (raw) {
                try {
                    const entry = JSON.parse(raw) as ReconnectEntry;
                    if (Date.now() > entry.expiresAt) keysToRemove.push(key);
                } catch {
                    keysToRemove.push(key);
                }
            }
        }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
}
