/**
 * @example
 * ````ts
 * await sleep(1000);
 * ````
 *
 * @param time to wait in ms.
 * If the time is `0` this is mostly mend to give other tasks the chance to get compute time
 * and not permanently block the thread.
 * @returns a Promise that resolves after {@link time}.
 */
export async function sleep(time: number) {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setTimeout(resolve, time));
}
