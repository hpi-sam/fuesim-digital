import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const addIsActiveToClient53: Migration = {
    action: (_, action) => {
        const typedAction = action as { type: string };
        switch (typedAction.type) {
            case '[Client] Add client': {
                const typedClientAction = action as {
                    client: { isActive?: boolean };
                };
                typedClientAction.client.isActive ??= true;
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
                [Key in UUID]: { isActive?: boolean };
            };
        };

        for (const client of Object.values(typedState.clients)) {
            client.isActive ??= true;
        }
    },
};
