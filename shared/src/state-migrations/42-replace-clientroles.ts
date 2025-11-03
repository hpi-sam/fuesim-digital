import type { UUID } from '../utils/index.js';
import type { Migration } from './migration-functions.js';

type OldRole = 'participant' | 'trainer';

interface ClientRole {
    type: 'clientrole';
    mainRole: 'participant' | 'trainer';
    specificRole: 'map-operator' | 'trainer';
}

interface Client {
    role: /* new */ ClientRole | /* old */ OldRole;
}

function migrateClientRole(oldRole: OldRole): ClientRole {
    return {
        type: 'clientrole',
        mainRole: oldRole,
        specificRole: oldRole === 'trainer' ? 'trainer' : 'map-operator',
    };
}

export const addPatientTransportPriority41: Migration = {
    action: (_, action) => {
        if ((action as { type: string }).type === '[Client] Add client') {
            const client = (action as { client: Client }).client;
            client.role = migrateClientRole(client.role as OldRole);
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            clients: {
                [clientId: UUID]: Client;
            };
        };

        Object.values(typedState.clients).forEach((client) => {
            client.role = migrateClientRole(client.role as OldRole);
        });
    },
};
