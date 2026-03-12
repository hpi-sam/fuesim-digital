import { parallelExerciseIdSchema, type UUID } from 'fuesim-digital-shared';
import type { ExerciseServer, ExerciseSocket } from '../../exercise-server.js';
import { NotFoundError, PermissionDeniedError } from '../../utils/http.js';
import {
    ClientWrapper,
    ParallelExerciseClientWrapper,
} from '../client-wrapper.js';
import type { Services } from '../../database/services/index.js';
import { Config } from '../../config.js';
import { secureOn } from './secure-on.js';

export const registerJoinParallelExerciseHandler = (
    io: ExerciseServer,
    socket: ExerciseSocket,
    services: Services
) => {
    secureOn(socket, 'joinParallelExercise', async (id: UUID, callback) => {
        if (!Config.parallelExercisesEnabled) {
            callback({
                success: false,
                message: 'This feature is not enabled.',
                expected: false,
            });
            return;
        }
        const clientWrapper = ClientWrapper.init(
            ParallelExerciseClientWrapper,
            socket,
            services
        );
        if (!clientWrapper) return;
        if (clientWrapper.exercise) {
            callback({
                success: false,
                message: 'The client has already joined a parallel exercise',
                expected: false,
            });
            return;
        }
        const parsedId = parallelExerciseIdSchema.safeParse(id);
        if (!parsedId.success) {
            callback({
                success: false,
                message: `Invalid payload: Invalid parallel exercise id`,
                expected: false,
            });
            return;
        }
        clientWrapper.getSessionInformation().then(() => {
            try {
                clientWrapper.joinParallelExercise(parsedId.data).then(() => {
                    clientWrapper
                        .getInstanceSummaries()
                        .then((exerciseInstanceSummaries) => {
                            callback({
                                success: true,
                                payload: {
                                    exerciseInstances:
                                        exerciseInstanceSummaries,
                                },
                            });
                        });
                });
            } catch (e: unknown) {
                if (
                    e instanceof NotFoundError ||
                    e instanceof PermissionDeniedError
                ) {
                    callback({
                        success: false,
                        message: 'The exercise does not exist',
                        expected: false,
                    });
                    return;
                }
                throw e;
            }
        });
    });
};
