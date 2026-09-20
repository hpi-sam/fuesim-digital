import fs from 'node:fs';
import { range } from 'lodash-es';
import { currentStateVersion } from '../state.js';
import { migrations } from './migration-functions.js';
import { migrateStateExport } from './migrations.js';

describe('migrations definition', () => {
    it('has the correct versions', () => {
        const expectKeys = range(2, currentStateVersion + 1).map((number) =>
            number.toString()
        );
        expect(Object.keys(migrations)).toStrictEqual(expectKeys);
    });
});

const basePath = '../test-scenarios/migration-test-scenarios';

describe('migration', () => {
    fs.readdirSync(basePath).forEach((stateDir) => {
        if (!/from-state-\d+/u.test(stateDir)) {
            console.warn(
                `${stateDir} does not match the format 'from-state-[stateVersion]'`
            );
            return;
        }
        if (!fs.lstatSync(`${basePath}/${stateDir}`).isDirectory()) {
            console.warn(
                `${basePath}/${stateDir} was expected to be a directory but is not`
            );
            return;
        }
        describe(stateDir, () => {
            fs.readdirSync(`${basePath}/${stateDir}`).forEach((typeDir) => {
                if (
                    typeDir !== 'combined-scenarios' &&
                    typeDir !== 'one-action' &&
                    typeDir !== 'state-altering-ui'
                ) {
                    console.warn(
                        `${stateDir} does not match the naming convention, it should be named 'combined-scenarios', 'one-action' or 'state-altering-ui' depending on its contents`
                    );
                    return;
                }
                if (
                    !fs
                        .lstatSync(`${basePath}/${stateDir}/${typeDir}`)
                        .isDirectory()
                ) {
                    console.warn(
                        `${basePath}/${stateDir}/${typeDir} was expected to be a directory but is not`
                    );
                    return;
                }
                const exercisePaths = fs.readdirSync(
                    `${basePath}/${stateDir}/${typeDir}`
                );
                const exercisePathsToTest = exercisePaths.filter(
                    (exercisePath) =>
                        !exercisePath.startsWith('EXCLUDE-FROM-TEST')
                );
                exercisePathsToTest.forEach((exercisePath) => {
                    if (
                        !fs
                            .lstatSync(
                                `${basePath}/${stateDir}/${typeDir}/${exercisePath}`
                            )
                            .isFile()
                    ) {
                        console.warn(
                            `${basePath}/${stateDir}/${typeDir}/${exercisePath} was expected to be a file but is not`
                        );
                    }
                });
                const testableExercisePaths = exercisePathsToTest.filter(
                    (exercisePath) =>
                        fs
                            .lstatSync(
                                `${basePath}/${stateDir}/${typeDir}/${exercisePath}`
                            )
                            .isFile()
                );
                if (testableExercisePaths.length === 0) {
                    console.warn(`${basePath}/${stateDir}/${typeDir} is empty`);
                    return;
                }

                describe(typeDir, () => {
                    describe.each(testableExercisePaths)(
                        '%s',
                        (exercisePath) => {
                            it('current state', async () => {
                                const exercise = JSON.parse(
                                    fs.readFileSync(
                                        `${basePath}/${stateDir}/${typeDir}/${exercisePath}`,
                                        'utf8'
                                    )
                                );

                                const newState = migrateStateExport({
                                    ...exercise,
                                    history: undefined,
                                });
                                expect(newState.dataVersion).toBe(
                                    currentStateVersion
                                );
                            });
                            it('complete history', async () => {
                                const exercise = JSON.parse(
                                    fs.readFileSync(
                                        `${basePath}/${stateDir}/${typeDir}/${exercisePath}`,
                                        'utf8'
                                    )
                                );

                                if (exercise.history) {
                                    const newState = migrateStateExport(
                                        exercise,
                                        false
                                    );
                                    expect(newState.dataVersion).toBe(
                                        currentStateVersion
                                    );
                                }
                            });
                        }
                    );
                });
            });
        });
    });
});
