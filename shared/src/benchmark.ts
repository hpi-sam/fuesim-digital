export interface BenchmarkValue<T> {
    /**
     * The value returned by the benchmarked function
     */
    value: T;
    /**
     * The average time it took to run the function in ms
     */
    time: number;
}

/**
 * @param functionToBenchmark the deterministic function that should be benchmarked, it will be run multiple times
 */
export function benchmark<Value>(
    exerciseKey: string,
    functionName: string,
    functionToBenchmark: () => Value
) {
    const benchmarkResult = runBenchmarkOnce(functionToBenchmark);

    insertResult(exerciseKey, functionName, benchmarkResult.time);
    return benchmarkResult.value;
}

function runBenchmarkOnce<Value>(
    functionToBenchmark: () => Value
): BenchmarkValue<Value> {
    const startTime = performance.now();
    const value = functionToBenchmark();
    const endTime = performance.now();
    return {
        value,
        time: endTime - startTime,
    };
}

function insertResult(
    exerciseKey: string,
    functionName: string,
    measurement: number
) {
    benchmarkResults[exerciseKey] ??= {};
    benchmarkResults[exerciseKey][functionName] ??= [];
    benchmarkResults[exerciseKey][functionName].push(measurement);
}

export function finishMeasurement(exerciseKey: string): any {
    if (!benchmarkResults[exerciseKey]) return;
    const results = benchmarkResults[exerciseKey];
    delete benchmarkResults[exerciseKey];
    return results;
}

const benchmarkResults: {
    [exerciseKey: string]: { [functionName: string]: number[] };
} = {};
