import type { Mutable, UUID } from '../utils/index.js';
import { uuid } from '../utils/index.js';
import type { ExerciseState } from '../state.js';
import type { Migration } from './migration-functions.js';

export const addOperationsTabletView45: Migration = {
    action: null,
    state: (state) => {
        const typedState = state as {
            operationalSections: { [key in UUID]: any };
            vehicles: { [key in UUID]: {
                operationalAssignment: null | undefined;
            } };
        };

        typedState.operationalSections ??= {};
        Object.values(typedState.vehicles).forEach((vehicle) => {
            vehicle.operationalAssignment ??= null;
        })
    },
};
