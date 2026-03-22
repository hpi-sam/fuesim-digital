import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

type OldRole = 'participant' | 'trainer';

interface ClientRole {
    type: 'clientRole';
    mainRole: 'participant' | 'trainer';
    specificRole: 'mapOperator' | 'trainer';
}

interface Client {
    role: /* new */ ClientRole | /* old */ OldRole;
}

function migrateClientRole(oldRole: OldRole): ClientRole {
    return {
        type: 'clientRole',
        mainRole: oldRole,
        specificRole: oldRole === 'trainer' ? 'trainer' : 'mapOperator',
    };
}

export const replaceClientRoles42: Migration = {
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
