import fs from 'node:fs';
import { UserReadableIdGenerator } from '../utils/user-readable-id-generator.js';
import { createTestEnvironment } from './utils.js';

const basePath = '../test-scenarios/migration-test-scenarios';

describe('migration', () => {
    const environment = createTestEnvironment();

    beforeEach(async () => {
        UserReadableIdGenerator.freeAll();
        environment.exerciseService.TESTING_getExerciseMap().clear();
    });

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
                    test.each(testableExercisePaths)(
                        'It imports %s without throwing an error',
                        async (exercisePath) => {
                            const exercise = JSON.parse(
                                fs.readFileSync(
                                    `${basePath}/${stateDir}/${typeDir}/${exercisePath}`,
                                    'utf8'
                                )
                            );
                            await environment
                                .httpRequest('post', '/api/exercise')
                                .send(exercise)
                                .expect(201);
                        },
                        120_000
                    );
                });
            });
        });
    });
});
