import type { ExerciseServer, ExerciseSocket } from '../../exercise-server.js';
import { clientMap } from '../client-map.js';
import { ParallelExerciseClientWrapper } from '../client-wrapper.js';
import { secureOn } from './secure-on.js';

export function registerControlParallelExerciseHandler(
    io: ExerciseServer,
    socket: ExerciseSocket
) {
    secureOn(socket, 'controlParallelExercise', async (action, callback) => {
        const clientWrapper = clientMap.get(socket);
        if (!(clientWrapper instanceof ParallelExerciseClientWrapper)) {
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
        switch (action) {
            case 'start':
                clientWrapper
                    .start()
                    .then(() => {
                        callback({
                            success: true,
                        });
                    })
                    .catch(() => {
                        callback({
                            success: false,
                            message: 'Starting the exercise failed.',
                            expected: false,
                        });
                    });
                break;
            case 'pause':
                clientWrapper
                    .pause()
                    .then(() => {
                        callback({
                            success: true,
                        });
                    })
                    .catch(() => {
                        callback({
                            success: false,
                            message: 'Pausing the exercise failed.',
                            expected: false,
                        });
                    });
                break;
        }
    });
}
