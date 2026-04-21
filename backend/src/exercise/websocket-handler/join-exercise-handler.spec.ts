import assert from 'node:assert';
import { jest } from '@jest/globals';
import type {
    GetExerciseTemplateResponseData,
    ParticipantKey,
} from 'fuesim-digital-shared';
import { generateDummyPatient, sleep } from 'fuesim-digital-shared';
import { ActiveExercise } from '../active-exercise.js';
import {
    alternativeTestUserSessionData,
    createExercise,
    createExerciseTemplate,
    createTestEnvironment,
    createTestUserSession,
} from '../../test/utils.js';
import type { SessionInformation } from '../../auth/auth-service.js';

describe('join exercise', () => {
    const environment = createTestEnvironment();

    it('adds the joining client to the state', async () => {
        const exerciseKey = (await createExercise(environment)).trainerKey;

        await environment.withWebsocket(async (clientSocket) => {
            const clientName = 'someRandomName';

            const joinExercise = await clientSocket.emit(
                'joinExercise',
                exerciseKey,
                clientName
            );

            expect(joinExercise.success).toBe(true);
            assert(joinExercise.success);
            expect(joinExercise.payload).toBeDefined();

            const getState = await clientSocket.emit('getState');
            expect(getState.success).toBe(true);

            assert(getState.success);
            expect(getState.payload).toBeDefined();
            expect(getState.payload.clients).toBeDefined();
            expect(
                Object.values(getState.payload.clients).filter(
                    (client) => client.name === clientName
                ).length
            ).toBe(1);
        });
    });

    it('fails joining a non-existing exercise', async () => {
        const id = '123456' as ParticipantKey;

        await environment.withWebsocket(async (socket) => {
            const join = await socket.emit('joinExercise', id, 'Test Client');

            expect(join.success).toBe(false);
        });
    });

    describe('exercise template', () => {
        let exerciseTemplate: GetExerciseTemplateResponseData;
        let session: string;
        let sessionInformation: SessionInformation;
        beforeEach(async () => {
            session = await createTestUserSession(environment);
            exerciseTemplate = await createExerciseTemplate(
                environment,
                session
            );
            sessionInformation =
                (await environment.services.authService.getDataFromSessionToken(
                    session
                ))!;
        });
        it('fails joining with trainer key if not logged in', async () => {
            await environment.withWebsocket(async (socket) => {
                const join = await socket.emit(
                    'joinExercise',
                    exerciseTemplate.trainerKey,
                    'Test Client'
                );

                expect(join.success).toBe(false);
            });
        });

        it('succeeds joining with trainer key if logged in', async () => {
            await environment.withWebsocket(async (socket) => {
                const join = await socket.emit(
                    'joinExercise',
                    exerciseTemplate.trainerKey,
                    'Test Client'
                );

                expect(join.success).toBe(true);
            }, session);
        });

        it('fails joining with trainer key if logged in with wrong user', async () => {
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await environment.withWebsocket(async (socket) => {
                const join = await socket.emit(
                    'joinExercise',
                    exerciseTemplate.trainerKey,
                    'Test Client'
                );

                expect(join.success).toBe(false);
            }, session2);
        });

        it('fails joining with participant key if not logged in', async () => {
            const exercise =
                await environment.services.exerciseService.getExerciseByKey(
                    exerciseTemplate.trainerKey,
                    sessionInformation
                );
            await environment.withWebsocket(async (socket) => {
                const join = await socket.emit(
                    'joinExercise',
                    exercise.participantKey,
                    'Test Client'
                );

                expect(join.success).toBe(false);
            });
        });
        it('fails joining with participant key if logged in', async () => {
            const exercise =
                await environment.services.exerciseService.getExerciseByKey(
                    exerciseTemplate.trainerKey,
                    sessionInformation
                );
            await environment.withWebsocket(async (socket) => {
                const join = await socket.emit(
                    'joinExercise',
                    exercise.participantKey,
                    'Test Client'
                );

                expect(join.success).toBe(false);
            }, session);
        });
    });

    it('ignores clients joining other exercises', async () => {
        const firstExerciseKey = (await createExercise(environment)).trainerKey;
        const secondExerciseKey = (await createExercise(environment))
            .trainerKey;

        await environment.withWebsocket(async (firstClientSocket) => {
            const firstClientName = 'someRandomName';

            await firstClientSocket.emit(
                'joinExercise',
                firstExerciseKey,
                firstClientName
            );

            await environment.withWebsocket(async (secondClientSocket) => {
                const secondClientName = 'anotherRandomName';

                await secondClientSocket.emit(
                    'joinExercise',
                    secondExerciseKey,
                    secondClientName
                );

                const state = await firstClientSocket.emit('getState');

                assert(state.success);
                expect(
                    Object.values(state.payload.clients).some(
                        (client) => client.name === secondClientName
                    )
                ).toBe(false);
            });
        });
    });

    it('sends a message to existing clients when another client is joining the exercises', async () => {
        const exerciseKey = (await createExercise(environment)).trainerKey;

        await environment.withWebsocket(async (firstClientSocket) => {
            const firstClientName = 'someRandomName';

            firstClientSocket.spyOn('performAction');

            await firstClientSocket.emit(
                'joinExercise',
                exerciseKey,
                firstClientName
            );

            await environment.withWebsocket(async (secondClientSocket) => {
                const secondClientName = 'anotherRandomName';

                await secondClientSocket.emit(
                    'joinExercise',
                    exerciseKey,
                    secondClientName
                );

                expect(firstClientSocket.getTimesCalled('performAction')).toBe(
                    1
                );
            });
        });
    });

    it('treats participant exercise the same as the trainer exercise', async () => {
        const exerciseKeys = await createExercise(environment);

        await environment.withWebsocket(async (trainerSocket) => {
            const joinTrainer = await trainerSocket.emit(
                'joinExercise',
                exerciseKeys.trainerKey,
                'trainer'
            );

            expect(joinTrainer.success).toBe(true);

            await environment.withWebsocket(async (participantSocket) => {
                const joinParticipant = await participantSocket.emit(
                    'joinExercise',
                    exerciseKeys.participantKey,
                    'participant'
                );

                expect(joinParticipant.success).toBe(true);

                trainerSocket.spyOn('performAction');
                participantSocket.spyOn('performAction');

                const patient = generateDummyPatient();

                // Proposing an action as the trainer
                const trainerPropose = await trainerSocket.emit(
                    'proposeAction',
                    {
                        type: '[Patient] Add patient',
                        patient,
                    }
                );

                expect(trainerPropose.success).toBe(true);

                await sleep(5);

                expect(trainerSocket.getTimesCalled('performAction')).toBe(1);
                expect(participantSocket.getTimesCalled('performAction')).toBe(
                    1
                );

                // Proposing an action as the participant
                const participantPropose = await participantSocket.emit(
                    'proposeAction',
                    {
                        type: '[Patient] Move patient',
                        patientId: patient.id,
                        targetPosition: {
                            x: 0,
                            y: 0,
                        },
                    }
                );

                expect(participantPropose.success).toBe(true);

                await sleep(5);

                expect(trainerSocket.getTimesCalled('performAction')).toBe(2);
                expect(participantSocket.getTimesCalled('performAction')).toBe(
                    2
                );
            });
        });
    });

    it('stops an exercise after the last client has left', async () => {
        const exerciseKeys = await createExercise(environment);

        const pauseSpy = jest.spyOn(ActiveExercise.prototype, 'pause');
        await environment.withWebsocket(async (socket) => {
            const joinResponse = await socket.emit(
                'joinExercise',
                exerciseKeys.trainerKey,
                'Test'
            );
            expect(joinResponse.success).toBe(true);

            const startResponse = await socket.emit('proposeAction', {
                type: '[Exercise] Start',
            });
            expect(startResponse.success);
        });
        // Let the socket disconnect.
        await sleep(1000);
        expect(pauseSpy).toHaveBeenCalledTimes(1);
    });
});
