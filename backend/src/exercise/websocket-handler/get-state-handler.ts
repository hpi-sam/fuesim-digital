import type { ExerciseSocket, ExerciseServer } from '../../exercise-server.js';
import { clientMap } from '../client-map.js';
import { ExerciseClientWrapper } from '../client-wrapper.js';
import { secureOn } from './secure-on.js';

export const registerGetStateHandler = (
    io: ExerciseServer,
    client: ExerciseSocket
) => {
    secureOn(client, 'getState', (callback): void => {
        const clientWrapper = clientMap.get(client);
        if (!(clientWrapper instanceof ExerciseClientWrapper)) {
            callback({
                success: false,
                message: 'No exercise selected',
                expected: false,
            });
            return;
        }
        if (!clientWrapper.exercise) {
            callback({
                success: false,
                message: 'No exercise selected',
                expected: false,
            });
            return;
        }
        callback({
            success: true,
            payload: clientWrapper.exercise.getStateSnapshot(),
        });
    });
};
