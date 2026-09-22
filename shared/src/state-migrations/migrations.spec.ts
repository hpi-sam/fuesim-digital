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
        // stateDir matches the format 'from-state-[stateVersion]'
        expect(stateDir).toMatch(/from-state-\d+/u);

        // stateDir is a directory
        expect(
            fs.lstatSync(`${basePath}/${stateDir}`).isDirectory()
        ).toBeTrue();

        describe(stateDir, () => {
            fs.readdirSync(`${basePath}/${stateDir}`).forEach((typeDir) => {
                // typeDir matches 'combined-scenarios', 'one-action' or 'state-altering-ui'
                expect([
                    'combined-scenarios',
                    'one-action',
                    'state-altering-ui',
                ]).toContain(typeDir);

                // typeDir is a directory
                expect(
                    fs
                        .lstatSync(`${basePath}/${stateDir}/${typeDir}`)
                        .isDirectory()
                ).toBeTrue();

                const exercisePaths = fs.readdirSync(
                    `${basePath}/${stateDir}/${typeDir}`
                );
                const exercisePathsToTest = exercisePaths.filter(
                    (exercisePath) =>
                        !exercisePath.startsWith('EXCLUDE-FROM-TEST')
                );
                exercisePathsToTest.forEach((exercisePath) => {
                    // exercisePath is a file
                    expect(
                        fs
                            .lstatSync(
                                `${basePath}/${stateDir}/${typeDir}/${exercisePath}`
                            )
                            .isFile()
                    ).toBeTrue();
                });

                expect(exercisePathsToTest).not.toHaveLength(0);

                describe(typeDir, () => {
                    describe.each(exercisePathsToTest)('%s', (exercisePath) => {
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
                    });
                });
            });
        });
    });
});
