import { checkCollectionRole } from 'fuesim-digital-shared';
import type { Services } from '../../database/services/index.js';
import type { ExerciseServer, ExerciseSocket } from '../../exercise-server.js';
import { ClientWrapper, CollectionClientWrapper } from '../client-wrapper.js';
import { secureOn } from './secure-on.js';

export function registerCollectionHandler(
    io: ExerciseServer,
    socket: ExerciseSocket,
    services: Services
) {
    secureOn(
        socket,
        'joinCollectionRoom',
        async (collectionEntityId, callback) => {
            const clientWrapper = ClientWrapper.init(
                CollectionClientWrapper,
                socket,
                services
            );
            if (!clientWrapper) return;

            await clientWrapper.getSessionInformation();

            if (clientWrapper.session === undefined) {
                callback({
                    success: false,
                    message: 'You are not authenticated',
                    expected: false,
                });
                return;
            }

            const relationship =
                await services.collectionService.getUserRoleInCollectionTransitive(
                    collectionEntityId,
                    clientWrapper.session.user.id
                );

            if (!relationship) {
                callback({
                    success: false,
                    message: 'You have no access to this collection',
                    expected: false,
                });
                return;
            }

            const rolecheck =
                checkCollectionRole(relationship).isAtLeast('viewer');

            if (!rolecheck) {
                callback({
                    success: false,
                    message: 'You have no access to this collection',
                    expected: false,
                });
                return;
            }

            await clientWrapper.startCollectionListener(collectionEntityId);
        }
    );

    secureOn(
        socket,
        'leaveCollectionRoom',
        async (collectionEntityId, callback) => {
            const clientWrapper = ClientWrapper.init(
                CollectionClientWrapper,
                socket,
                services
            );
            if (!clientWrapper) return;

            await clientWrapper.stopCollectionListener(collectionEntityId);
        }
    );
}
