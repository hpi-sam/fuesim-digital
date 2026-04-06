import {
    type UUID,
    type ExerciseKey,
    joinExerciseResponseDataSchema,
    isExerciseKey,
} from 'fuesim-digital-shared';
import type { ExerciseServer, ExerciseSocket } from '../../exercise-server.js';
import { NotFoundError, PermissionDeniedError } from '../../utils/http.js';
import { ClientWrapper, ExerciseClientWrapper } from '../client-wrapper.js';
import type { Services } from '../../database/services/index.js';
import { secureOn } from './secure-on.js';

export function registerJoinExerciseHandler(
    io: ExerciseServer,
    socket: ExerciseSocket,
    services: Services
) {
    secureOn(
        socket,
        'joinExercise',
        (exerciseKey: ExerciseKey, clientName: string, callback) => {
            const clientWrapper = ClientWrapper.init(
                ExerciseClientWrapper,
                socket,
                services
            );
            if (!clientWrapper) return;

            // When this listener is registered the socket is in the map.
            if (clientWrapper.exercise) {
                callback({
                    success: false,
                    message: 'The client has already joined an exercise',
                    expected: false,
                });
                return;
            }
            if (!isExerciseKey(exerciseKey)) {
                callback({
                    success: false,
                    message: `Invalid payload: Invalid exercise key`,
                    expected: false,
                });
                return;
            }

            clientWrapper.getSessionInformation().then(() => {
                let clientId: UUID | undefined;
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
                                  exercise: clientWrapper.exercise!,
                              }
                            : null,
                        parallelExerciseId:
                            clientWrapper.exercise!.exercise.parallelExerciseId,
                    }),
                });
            });
        }
    );
}
