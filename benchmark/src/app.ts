/// <reference types="@types/node" />

import { promises as fs } from 'node:fs';
import os from 'node:os';
import { countBy } from 'lodash-es';
import { print } from './print.js';
import { steps, StepState } from './steps.js';

// Print some information about the system
console.log(`
System Information:
  OS:      ${os.version()} ${os.release()}
  CPUs:    ${Object.entries(countBy(os.cpus(), (cpu) => cpu.model))
      .map(([model, count]) => `${count} × ${model}`)
      .join(', ')}
  RAM:     ${Math.round(os.totalmem() / 1024 / 1024)}MB
  Node.js: ${process.version}

`);

const pathToData = 'data';

const filenames = await fs.readdir(pathToData);
const fileBenchmarkResults: BenchmarkResult[] = [];

for (const filename of filenames) {
    // eslint-disable-next-line no-await-in-loop
    const benchmarkResult = await benchmarkFile(filename);
    print('\n\n');
    if (benchmarkResult) {
        fileBenchmarkResults.push(benchmarkResult);
    }
}

// Print the end results to the console
print('\n');
console.table(
    fileBenchmarkResults
        .map((result) => ({
            fileName: result.fileName,
            fileSize: `${(result.fileSize / 1024 / 1024).toPrecision(2)}MB`,
            ...steps
                .map((step) => step.getColumnToPrint(result.stepState))
                .reduce((columns, column) => ({ ...columns, ...column }), {}),
        }))
        // We don't want an extra column for the array index
        .reduce<{ [fileName: string]: any }>((table, { fileName, ...rest }) => {
            table[fileName] = rest;
            return table;
        }, {})
);

interface BenchmarkResult {
    fileName: string;
    /**
     * Size of the file in bytes
     */
    fileSize: number;
    /**
     * Not all steps results must be included in this state, as some steps might not be run because of an error in a previous step
     */
    stepState: StepState;
}

async function benchmarkFile(
    fileName: string
): Promise<BenchmarkResult | undefined> {
    const path = `${pathToData}/${fileName}`;
    let data;
    try {
        data = await fs.readFile(path, 'utf8');
    } catch {
        print(`Could not read file ${fileName}\n`, 'red');
        return;
    }
    const fileSize = (await fs.stat(path)).size;
    print(`${fileName}\n`, 'blue');
    let parsedData;
    try {
        parsedData = JSON.parse(data);
    } catch {
        print('Error while parsing state export\n', 'red');
        return;
    }

    const stepState = new StepState(parsedData);
    for (const step of steps) {
        try {
            step.run(stepState);
        } catch (error: any) {
            print(`${error}\n`, 'red');
            break;
        }
    }
    return {
        fileName,
        fileSize,
        stepState,
    };
}
