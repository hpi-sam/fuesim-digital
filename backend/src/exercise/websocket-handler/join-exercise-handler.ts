import {
    type ExerciseKey,
    isExerciseKey,
    joinExerciseResponseDataSchema,
    type UUID,
} from 'fuesim-digital-shared';
import type { ExerciseServer, ExerciseSocket } from '../../exercise-server.js';
import { clientMap } from '../client-map.js';
import { NotFoundError, PermissionDeniedError } from '../../utils/http.js';
import type { AuthService } from '../../auth/auth-service.js';
import { ExerciseClientWrapper } from '../client-wrapper.js';
import type { ExerciseService } from '../../database/services/exercise-service.js';
import { secureOn } from './secure-on.js';

export const registerJoinExerciseHandler = (
    io: ExerciseServer,
    socket: ExerciseSocket,
    authService: AuthService,
    exerciseService: ExerciseService
) => {
    secureOn(
        socket,
        'joinExercise',
        (exerciseKey: ExerciseKey, clientName: string, callback) => {
            const clientWrapper = new ExerciseClientWrapper(
                socket,
                authService,
                exerciseService
            );
            clientMap.set(socket, clientWrapper);

            clientWrapper.getSessionInformation().then(() => {
                // When this listener is registered the socket is in the map.
                if (clientWrapper.exercise) {
                    callback({
                        success: false,
                        message: 'The client has already joined an exercise',
                        expected: false,
                    });
                    return;
                }
                let clientId: UUID | undefined;
                if (!isExerciseKey(exerciseKey)) {
                    callback({
                        success: false,
                        message: `Invalid payload: Invalid exercise key`,
                        expected: false,
                    });
                    return;
                }
                try {
                    clientId = clientWrapper.joinExercise(
                        exerciseKey,
                        clientName
                    );
                } catch (e: unknown) {
                    if (e instanceof NotFoundError) {
                        callback({
                            success: false,
                            message: 'The exercise does not exist',
                            expected: false,
                        });
                        return;
                    }
                    if (e instanceof PermissionDeniedError) {
                        callback({
                            success: false,
                            message: 'You have no permission for this exercise',
                            expected: false,
                        });
                        return;
                    }
                    throw e;
                }
                callback({
                    success: true,
                    payload: joinExerciseResponseDataSchema.encode({
                        clientId,
                        exerciseTemplate: clientWrapper.exercise!.template
                            ? {
                                  ...clientWrapper.exercise!.template,
                                  trainerKey:
                                      clientWrapper.exercise!.trainerKey,
                              }
                            : null,
                    }),
                });
            });
        }
    );
};
