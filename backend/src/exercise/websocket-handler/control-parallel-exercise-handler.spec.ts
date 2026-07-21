import type {
    GetParallelExerciseResponseData,
    OrganisationMembershipRole,
} from 'fuesim-digital-shared';
import {
    alternativeTestUserSessionData,
    createExerciseTemplate,
    createTestEnvironment,
    createTestUserSession,
    defaultTestUserSessionData,
} from '../../test/utils.js';
import {
    createParallelExercise,
    joinParallelExercise,
} from '../../test/parallel-exercise-utils.js';
import { createOrganisation } from '../../test/organisation-utils.js';

describe('control parallel exercise', () => {
    const environment = createTestEnvironment();
    let parallelExercise: GetParallelExerciseResponseData;
    let session: string;
    beforeEach(async () => {
        environment.services.exerciseService.TESTING_getExerciseMap().clear();
        session = await createTestUserSession(environment);
        parallelExercise = await createParallelExercise(environment, session);
    });

    it('fails if viewer of organisation', async () => {
        const session2 = await createTestUserSession(environment, {
            user: alternativeTestUserSessionData,
        });
        const organisation = await createOrganisation(environment, session2);
        await environment.repositories.organisationRepository.addMemberToOrganisation(
            organisation.id,
            defaultTestUserSessionData.id,
            'viewer'
        );
        const exerciseTemplate = await createExerciseTemplate(
            environment,
            session2,
            organisation.id
        );
        parallelExercise = await createParallelExercise(
            environment,
            session2,
            exerciseTemplate
        );

        await environment.withWebsocket(async (socket) => {
            const result = await socket.emit(
                'joinParallelExercise',
                parallelExercise.id
            );
            expect(result.success).toBe(true);

            const result2 = await socket.emit(
                'controlParallelExercise',
                'start'
            );
            expect(result2.success).toBe(false);
        }, session);
    });

    it.each(['editor', 'admin'] satisfies OrganisationMembershipRole[])(
        'succeeds if %s',
        async (role) => {
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            const organisation = await createOrganisation(
                environment,
                session2
            );
            await environment.repositories.organisationRepository.addMemberToOrganisation(
                organisation.id,
                defaultTestUserSessionData.id,
                role
            );

            const exerciseTemplate = await createExerciseTemplate(
                environment,
                session2,
                organisation.id
            );
            parallelExercise = await createParallelExercise(
                environment,
                session2,
                exerciseTemplate
            );

            await environment.withWebsocket(async (socket) => {
                const result = await socket.emit(
                    'joinParallelExercise',
                    parallelExercise.id
                );
                expect(result.success).toBe(true);

                const result2 = await socket.emit(
                    'controlParallelExercise',
                    'start'
                );
                expect(result2.success).toBe(true);
            }, session);
        }
    );

    it('start and stop parallel exercise', async () => {
        await environment.withWebsocket(async (socket) => {
            await socket.emit('joinParallelExercise', parallelExercise.id);

            const joinedParticipant1 = await joinParallelExercise(
                environment,
                parallelExercise
            );
            const joinedParticipant2 = await joinParallelExercise(
                environment,
                parallelExercise
            );

            await environment.withWebsocket(async (clientSocket1) => {
                await clientSocket1.emit('joinExercise', {
                    exerciseKey: joinedParticipant1.participantKey,
                    clientName: '',
                });

                await environment.withWebsocket(async (clientSocket2) => {
                    await clientSocket2.emit('joinExercise', {
                        exerciseKey: joinedParticipant2.participantKey,
                        clientName: '',
                    });

                    await socket.emit('controlParallelExercise', 'start');

                    for (const joinedParticipant of [
                        joinedParticipant1,
                        joinedParticipant2,
                    ]) {
                        const state = environment.services.exerciseService
                            .TESTING_getExerciseMap()
                            .get(joinedParticipant.participantKey)!.exercise
                            .currentStateString;

                        expect(state.currentStatus).toBe('running');
                    }

                    await socket.emit('controlParallelExercise', 'pause');

                    for (const joinedParticipant of [
                        joinedParticipant1,
                        joinedParticipant2,
                    ]) {
                        const state = environment.services.exerciseService
                            .TESTING_getExerciseMap()
                            .get(joinedParticipant.participantKey)!.exercise
                            .currentStateString;

                        expect(state.currentStatus).toBe('paused');
                    }
                });
            });
        }, session);
    });
});
