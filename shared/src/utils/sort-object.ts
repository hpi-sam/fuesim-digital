import { TypeAssertedObject } from './type-asserted-object.js';

/**
 *
 * @param obj The object to sort. It will not be mutated.
 * @param compareFn Function used to determine the order of the elements.
 * It gets the key and value of the elements to compare as arguments.
 * It is expected to return a negative value if the first argument is less than the second argument,
 * zero if they're equal, and a positive value otherwise.
 * @returns A new object with the same keys as obj and the keys and values sorted according to the compareFn.
 *
 * @example
 * ````ts
 * const obj = { c: 3, b: 2, a: 1 };
 * const sortedObj = sortObject(obj, ([keyA, valueA], [keyB, valueB]) => valueA - valueB);
 * // sortedObj = { a: 1, b: 2, c: 3 }
 * ````
 */
export function sortObject<T extends { [key: string]: any }>(
    obj: T,
    compareFn: (a: [keyof T, T[keyof T]], b: [keyof T, T[keyof T]]) => number
): T {
    return Object.fromEntries(TypeAssertedObject.entries(obj).sort(compareFn)) as T;
}
