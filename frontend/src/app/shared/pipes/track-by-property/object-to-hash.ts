import { stringCompare } from 'fuesim-digital-shared';
import { hashString } from './hash-string';

/**
 * @returns a deterministic string representation of all objects, that are deepEqual (by value) to each other
 */
export function objectToHash(anObject: {
    [key: number | string]: any;
}): string {
    // See https://stackoverflow.com/a/53593328
    const allKeys: string[] = [];
    // Get all keys (worse performance than Object.keys, but in contrast works recursively + is reliable)
    JSON.stringify(anObject, (key, value) => {
        allKeys.push(key);
        return value;
    });
    allKeys.sort((a, b) => stringCompare(a, b));
    return hashString(JSON.stringify(anObject, allKeys));
}
