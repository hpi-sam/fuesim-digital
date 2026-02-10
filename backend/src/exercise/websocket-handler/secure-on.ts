import type { ClientToServerEvents } from 'fuesim-digital-shared';
import type { SocketReservedEventsMap } from '../../../node_modules/socket.io/dist/socket-types.js';
import type {
    ReservedOrUserEventNames,
    ReservedOrUserListener,
} from '../../../node_modules/socket.io/dist/typed-events.js';
import type { ExerciseSocket } from '../../exercise-server.js';

function isDevelopment() {
    return process.env['NODE_ENV'] !== 'production';
}

export function secureOn<
    Ev extends ReservedOrUserEventNames<
        SocketReservedEventsMap,
        ClientToServerEvents
    >,
    Callback extends ReservedOrUserListener<
        SocketReservedEventsMap,
        ClientToServerEvents,
        Ev
    >,
>(client: ExerciseSocket, event: Ev, listener: Callback) {
    client.on(event, (async (
        arg0: any,
        arg1: any,
        callback: any,
        ...args: any[]
    ) => {
        try {
            await listener(arg0, arg1, callback, ...args);
        } catch (e: unknown) {
            if (isDevelopment()) {
                throw e;
            }
            console.warn(
                `An error occurred while receiving a \`${event}\` event.`,
                e
            );
        }
    }) as Callback);
}
