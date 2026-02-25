import type { ExerciseServer, ExerciseSocket } from '../../exercise-server.js';
import { clientMap } from '../client-map.js';
import { ParallelExerciseClientWrapper } from '../client-wrapper.js';
import { secureOn } from './secure-on.js';

export const registerStartParallelExerciseHandler = (
    io: ExerciseServer,
    socket: ExerciseSocket
) => {
    secureOn(socket, 'startParallelExercise', async (callback) => {
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
        await clientWrapper.start();
        callback({
            success: true,
        });
    });
};
