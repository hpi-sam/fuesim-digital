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
                await clientWrapper.start();
                break;
            case 'pause':
                await clientWrapper.pause();
                break;
        }
        callback({
            success: true,
        });
    });
}
