import type { Services } from '../../database/services/index.js';
import type { ExerciseServer, ExerciseSocket } from '../../exercise-server.js';
import { ClientWrapper, CollectionClientWrapper } from '../client-wrapper.js';
import { clientMap } from '../client-map.js';
import type { Repositories } from '../../database/repositories/index.js';
import { secureOn } from './secure-on.js';

export function registerCollectionHandler(
    io: ExerciseServer,
    socket: ExerciseSocket,
    services: Services,
    repositories: Repositories
) {
    secureOn(socket, 'registerCollectionListenerClient', async (callback) => {
        const clientWrapper = ClientWrapper.init(
            CollectionClientWrapper,
            socket,
            services,
            repositories
        );
        if (!clientWrapper) {
            callback({
                success: false,
                expected: false,
                message: 'Could not register Collection Listener',
            });
            return;
        }

        await clientWrapper.getSessionInformation();

        callback({
            success: true,
        });
    });

    secureOn(
        socket,
        'joinCollectionRoom',
        async (collectionEntityId, callback) => {
            const clientWrapper = clientMap.get(socket);
            if (!(clientWrapper instanceof CollectionClientWrapper)) {
                return;
            }

            const canAccessCollection =
                await clientWrapper.canAccessCollection(collectionEntityId);

            if (!canAccessCollection) {
                callback({
                    success: false,
                    message:
                        'User doesnt have sufficient permissions to access this collection',
                    expected: false,
                });
                return;
            }

            const initialData =
                await clientWrapper.startCollectionListener(collectionEntityId);
            if (!initialData) {
                callback({
                    success: false,
                    message: 'Failed to load initial data for this collection',
                    expected: false,
                });
                return;
            }

            callback({
                success: true,
                payload: initialData,
            });
        }
    );

    secureOn(
        socket,
        'leaveCollectionRoom',
        async (collectionEntityId, callback) => {
            const clientWrapper = clientMap.get(socket);
            if (!(clientWrapper instanceof CollectionClientWrapper)) {
                return;
            }

            await clientWrapper.stopCollectionListener(collectionEntityId);
        }
    );
}
