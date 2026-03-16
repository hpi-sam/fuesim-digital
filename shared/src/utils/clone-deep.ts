import type { Immutable, WritableDraft } from 'immer';
import { freeze } from 'immer';
import { cloneDeep } from 'lodash-es';

/**
 * @param obj The object to clone
 * @returns The deep (recursively) cloned object with the mutable type
 * If you need an immutable clone of the object use {@link cloneDeepImmutable}
 */
export function cloneDeepMutable<T>(
    obj: T
): T extends object ? WritableDraft<T> : T {
    return cloneDeep(obj) as T extends object ? WritableDraft<T> : T;
}

/**
 * @param obj The object to clone
 * @returns The deep (recursively) cloned and frozen object with an immutable type
 * If you need a mutable clone of the object use {@link cloneDeepMutable}
 */
export function cloneDeepImmutable<T>(
    obj: T
): T extends object ? Immutable<T> : T {
    return freeze(cloneDeep(obj) as T extends object ? Immutable<T> : T, true);
}
