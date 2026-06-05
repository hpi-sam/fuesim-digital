import type { ExerciseSocket, ExerciseServer } from '../../exercise-server.js';
import { clientMap } from '../client-map.js';
import { ParallelExerciseClientWrapper } from '../client-wrapper.js';
import { secureOn } from './secure-on.js';

export function registerGetParallelTracesOverviewHandler(
    io: ExerciseServer,
    client: ExerciseSocket
) {
    secureOn(client, 'getParallelTracesOverview', (callback): void => {
        const clientWrapper = clientMap.get(client);
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
        clientWrapper
            .getParallelTracesOverview()
            .then((overview) => {
                callback({
                    success: true,
                    payload: overview,
                });
            })
            .catch((e) => {
                console.error(e);
                callback({
                    success: false,
                    message: 'Fetching data failed',
                    expected: false,
                });
            });
    });
}
