import type { ExerciseServer, ExerciseSocket } from '../../exercise-server.js';
import { clientMap } from '../client-map.js';
import { ParallelExerciseClientWrapper } from '../client-wrapper.js';
import { secureOn } from './secure-on.js';

export const registerPauseParallelExerciseHandler = (
    io: ExerciseServer,
    socket: ExerciseSocket
) => {
    secureOn(socket, 'pauseParallelExercise', async (callback) => {
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
        await clientWrapper.pause();
        callback({
            success: true,
        });
    });
};
