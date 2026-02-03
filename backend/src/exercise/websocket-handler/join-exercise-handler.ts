import {
    joinExerciseResponseDataSchema,
    type UUID,
} from 'digital-fuesim-manv-shared';
import { ValidationErrorWrapper } from '../../utils/validation-error-wrapper.js';
import type { ExerciseServer, ExerciseSocket } from '../../exercise-server.js';
import { clientMap } from '../client-map.js';
import { isExerciseKey } from '../exercise-keys.js';
import { secureOn } from './secure-on.js';

export const registerJoinExerciseHandler = (
    io: ExerciseServer,
    client: ExerciseSocket
) => {
    secureOn(
        client,
        'joinExercise',
        (exerciseKey: string, clientName: string, callback): void => {
            // When this listener is registered the socket is in the map.
            const clientWrapper = clientMap.get(client)!;
            if (clientWrapper.exercise) {
                callback({
                    success: false,
                    message: 'The client has already joined an exercise',
                    expected: false,
                });
                return;
            }
            let clientId: UUID | undefined;
            try {
                if (!isExerciseKey(exerciseKey)) {
                    throw new ValidationErrorWrapper(['Invalid exercise key']);
                }
                clientId = clientWrapper.joinExercise(exerciseKey, clientName);
            } catch (e: unknown) {
                if (e instanceof ValidationErrorWrapper) {
                    callback({
                        success: false,
                        message: `Invalid payload: ${e.errors}`,
                        expected: false,
                    });
                    return;
                }
                throw e;
            }
            if (!clientId) {
                callback({
                    success: false,
                    message: 'The exercise does not exist',
                    expected: false,
                });
                return;
            }
            callback({
                success: true,
                payload: joinExerciseResponseDataSchema.encode({
                    clientId,
                    exerciseTemplate: clientWrapper.exercise!.template
                        ? {
                              ...clientWrapper.exercise!.template,
                              trainerId: clientWrapper.exercise!.trainerKey,
                          }
                        : null,
                }),
            });
        }
    );
};
