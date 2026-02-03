import type { UUID } from '../utils/index.js';
import type { Migration } from './migration-functions.js';

export const addOperationsTabletView45: Migration = {
    action: null,
    state: (state) => {
        const typedState = state as {
            operationalSections: { [key in UUID]: any } | undefined;
            vehicles: {
                [key in UUID]: {
                    operationalAssignment: object | null | undefined;
                };
            };
        };

        typedState.operationalSections ??= {};
        Object.values(typedState.vehicles).forEach((vehicle) => {
            vehicle.operationalAssignment ??= null;
        });
    },
};
