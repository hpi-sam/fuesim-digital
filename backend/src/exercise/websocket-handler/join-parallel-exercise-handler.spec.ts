import assert from 'node:assert';
import type {
    GetParallelExerciseResponseData,
    ParallelExerciseInstanceSummary,
} from 'fuesim-digital-shared';
import { uuid } from 'fuesim-digital-shared';
import {
    alternativeTestUserSessionData,
    createTestEnvironment,
    createTestUserSession,
} from '../../test/utils.js';
import {
    createParallelExercise,
    joinParallelExercise,
} from '../../test/parallel-exercise-utils.js';

describe('join parallel exercise', () => {
    const environment = createTestEnvironment();
    let parallelExercise: GetParallelExerciseResponseData;
    let session: string;
    beforeEach(async () => {
        environment.services.exerciseService.TESTING_getExerciseMap().clear();
        session = await createTestUserSession(environment);
        parallelExercise = await createParallelExercise(environment, session);
    });

    it('fails joining a non-existing parallel exercise', async () => {
        await environment.withWebsocket(async (socket) => {
            const join = await socket.emit('joinParallelExercise', uuid());

            expect(join.success).toBe(false);
        });
    });

    it('fails joining with an invalid id', async () => {
        await environment.withWebsocket(async (socket) => {
            const join = await socket.emit('joinParallelExercise', 'invalid');

            expect(join.success).toBe(false);
        });
    });

    it('fails joining if not logged in', async () => {
        await environment.withWebsocket(async (socket) => {
            const join = await socket.emit(
                'joinParallelExercise',
                parallelExercise.id
            );

            expect(join.success).toBe(false);
        });
    });

    it('succeeds joining if logged in', async () => {
        await environment.withWebsocket(async (socket) => {
            const join = await socket.emit(
                'joinParallelExercise',
                parallelExercise.id
            );

            expect(join.success).toBe(true);
            assert(join.success);
            expect(join.payload.exerciseInstances.length).toBe(0);
        }, session);
    });

    it('fails joining if logged in with wrong user', async () => {
        const session2 = await createTestUserSession(environment, {
            user: alternativeTestUserSessionData,
        });
        await environment.withWebsocket(async (socket) => {
            const join = await socket.emit(
                'joinParallelExercise',
                parallelExercise.id
            );

            expect(join.success).toBe(false);
        }, session2);
    });

    it('fails double joining', async () => {
        await environment.withWebsocket(async (socket) => {
            const join = await socket.emit(
                'joinParallelExercise',
                parallelExercise.id
            );

            expect(join.success).toBe(true);

            const join2 = await socket.emit(
                'joinParallelExercise',
                parallelExercise.id
            );
            expect(join2.success).toBe(false);
        }, session);
    });

    it('gives information about exercise instances on join', async () => {
        await environment.withWebsocket(async (socket) => {
            const joinedParticipant = await joinParallelExercise(
                environment,
                parallelExercise
            );
            const newExercise = environment.services.exerciseService
                .TESTING_getExerciseMap()
                .get(joinedParticipant.participantKey)!;

            const join = await socket.emit(
                'joinParallelExercise',
                parallelExercise.id
            );

            expect(join.success).toBe(true);
            assert(join.success);
            expect(join.payload.exerciseInstances.length).toBe(1);
            const exerciseInstance = join.payload.exerciseInstances[0]!;
            expect(exerciseInstance).toMatchObject({
                participantKey: joinedParticipant.participantKey,
                trainerKey: newExercise.trainerKey,
                clientNames: [],
                currentStatus: 'notStarted',
                currentTime: 0,
                isActive: false,
            } satisfies ParallelExerciseInstanceSummary);
        }, session);
    });

    it('get update on client gets added', async () => {
        await environment.withWebsocket(async (socket) => {
            const join = await socket.emit(
                'joinParallelExercise',
                parallelExercise.id
            );

            const joinedParticipant = await joinParallelExercise(
                environment,
                parallelExercise
            );

            const response = await socket.waitOn('updateExerciseInstances');

            expect(response.exerciseInstances.length).toBe(1);
            const exerciseInstance = response.exerciseInstances[0]!;
            expect(exerciseInstance.participantKey).toBe(
                joinedParticipant.participantKey
            );
            expect(exerciseInstance.isActive).toBe(false);
        }, session);
    });

    it('get update on client gets active', async () => {
        await environment.withWebsocket(async (socket) => {
            const clientName = 'someRandomName';
            const join = await socket.emit(
                'joinParallelExercise',
                parallelExercise.id
            );

            const joinedParticipant = await joinParallelExercise(
                environment,
                parallelExercise
            );

            socket.spyOn('updateExerciseInstances');

            await environment.withWebsocket(async (clientSocket) => {
                const joinExercise = await clientSocket.emit(
                    'joinExercise',
                    joinedParticipant.participantKey,
                    clientName
                );

                const response = await socket.waitOn('updateExerciseInstances');
                console.log(response);
                expect(response.exerciseInstances.length).toBe(1);
                const exerciseInstance = response.exerciseInstances[0]!;
                expect(exerciseInstance.participantKey).toBe(
                    joinedParticipant.participantKey
                );
                expect(exerciseInstance.isActive).toBe(true);
                expect(exerciseInstance.clientNames).toStrictEqual([
                    clientName,
                ]);
            });
        }, session);
    });

    // TODO Client names kept on leave
});
