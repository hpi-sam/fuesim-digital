import type { ExerciseAction } from 'fuesim-digital-shared';
import {
    ReducerError,
    ExpectedReducerError,
    validateExerciseAction,
    validatePermissions,
} from 'fuesim-digital-shared';
import type { ExerciseServer, ExerciseSocket } from '../../exercise-server.js';
import { clientMap } from '../client-map.js';
import { ExerciseClientWrapper } from '../client-wrapper.js';
import { secureOn } from './secure-on.js';

export function registerProposeActionHandler(
    io: ExerciseServer,
    client: ExerciseSocket
) {
    secureOn(
        client,
        'proposeAction',
        (action: ExerciseAction, callback): void => {
            const clientWrapper = clientMap.get(client);
            if (!(clientWrapper instanceof ExerciseClientWrapper)) {
                callback({
                    success: false,
                    message: 'No exercise selected',
                    expected: false,
                });
                return;
            }
            // 1. validate json
            const errors = validateExerciseAction(action);
            if (errors.length > 0) {
                callback({
                    success: false,
                    message: `Invalid payload: ${errors}`,
                    expected: false,
                });
                return;
            }
            // 2. Get matching exercise wrapper & client wrapper
            const activeExercise = clientWrapper.exercise;
            if (!activeExercise) {
                callback({
                    success: false,
                    message: 'No exercise selected',
                    expected: false,
                });
                return;
            }

            if (!clientWrapper.client) {
                callback({
                    success: false,
                    message: 'No client selected',
                    expected: false,
                });
                return;
            }

            const exerciseClient =
                activeExercise.getStateSnapshot().clients[
                    clientWrapper.client.id
                ];
            if (!exerciseClient) {
                callback({
                    success: false,
                    message: 'Client not part of the exercise',
                    expected: false,
                });
                return;
            }

            // 3. validate user permissions
            if (
                !validatePermissions(
                    exerciseClient,
                    action,
                    activeExercise.getStateSnapshot()
                )
            ) {
                callback({
                    success: false,
                    message: 'No sufficient rights',
                    expected: false,
                });
                return;
            }
            // 4. apply & broadcast action (+ save to timeline)
            try {
                activeExercise.applyAction(action, clientWrapper.client.id);
            } catch (error: any) {
                if (error instanceof ReducerError) {
                    if (error instanceof ExpectedReducerError) {
                        callback({
                            success: false,
                            message: error.message,
                            expected: true,
                        });
                    } else {
                        callback({
                            success: false,
                            message: error.message,
                            expected: false,
                        });
                    }
                    return;
                }
                throw error;
            }
            // 5. send success response to emitting client
            callback({
                success: true,
            });
        }
    );
}
