import { parallelExerciseIdSchema, type UUID } from 'fuesim-digital-shared';
import type { ExerciseServer, ExerciseSocket } from '../../exercise-server.js';
import { clientMap } from '../client-map.js';
import { NotFoundError, PermissionDeniedError } from '../../utils/http.js';
import { ParallelExerciseClientWrapper } from '../client-wrapper.js';
import type { ExerciseService } from '../../database/services/exercise-service.js';
import type { AuthService } from '../../auth/auth-service.js';
import type { ParallelExerciseService } from '../../database/services/parallel-exercise-service.js';
import { secureOn } from './secure-on.js';

export const registerJoinParallelExerciseHandler = (
    io: ExerciseServer,
    socket: ExerciseSocket,
    authService: AuthService,
    exerciseService: ExerciseService,
    parallelExerciseService: ParallelExerciseService
) => {
    secureOn(socket, 'joinParallelExercise', async (id: UUID, callback) => {
        const clientWrapper = new ParallelExerciseClientWrapper(
            socket,
            authService,
            exerciseService,
            parallelExerciseService
        );
        clientMap.set(socket, clientWrapper);
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
        try {
            await clientWrapper.joinParallelExercise(parsedId.data);
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

        const exerciseInstanceSummaries =
            await clientWrapper.getInstanceSummaries();
        callback({
            success: true,
            payload: {
                exerciseInstances: exerciseInstanceSummaries,
            },
        });
    });
};
