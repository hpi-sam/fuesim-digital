export function toUtf8Base64(text: string) {
    /*
     * Note: This approach is not optimal, since we convert the UTF-8 byte array back to a string before passing it to `btoa`.
     * A better solution would be to use `Uint8Array.prototype.toBase64()`, i.e., just call `data.toBase64()`
     * (see https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64).
     * However, this feature is rather new and might not be supported in all browsers yet.
     * TODO: If you encounter this comment, check whether switching to `Uint8Array.prototype.toBase64()` is feasible.
     */
    const data = new TextEncoder().encode(text);
    return btoa(String.fromCharCode(...data));
}
