/**
 * Compare two strings. Operates similar to {@link String.prototype.localeCompare}, but locale-agnostic.
 * @param a The reference string
 * @param b The string to compare with the reference
 * @returns `-1`, if {@link a} sorts before {@link b}, `1`, if {@link b} sorts before {@link a} and `0` otherwise ({@link a} and {@link b} are equal)
 */
export function stringCompare(a: string, b: string) {
    if (a < b) return -1;
    else if (a > b) return 1;
    return 0;
}
