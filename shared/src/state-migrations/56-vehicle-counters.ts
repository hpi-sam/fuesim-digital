import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const vehicleCounters56: Migration = {
    action: null,
    state: (state) => {
        const typedState = state as {
            vehicleCounters?: {
                [key: UUID]: number;
            };
        };

        typedState.vehicleCounters = {};
    },
};
