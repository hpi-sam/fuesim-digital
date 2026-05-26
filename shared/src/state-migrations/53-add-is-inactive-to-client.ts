import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const addIsInactiveToClient53: Migration = {
    action: (_, action) => {
        const typedAction = action as { type: string };
        switch (typedAction.type) {
            case '[Client] Add client': {
                const typedClientAction = action as {
                    client: { isInactive?: boolean };
                };
                typedClientAction.client.isInactive ??= false;
                break;
            }
            default:
                break;
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            clients: {
                [Key in UUID]: { isInactive?: boolean };
            };
        };

        for (const client of Object.values(typedState.clients)) {
            client.isInactive ??= false;
        }
    },
};
