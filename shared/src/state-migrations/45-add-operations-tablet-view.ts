import type { Mutable, UUID } from '../utils/index.js';
import { uuid } from '../utils/index.js';
import type { ExerciseState } from '../state.js';
import type { Migration } from './migration-functions.js';

export const addOperationsTabletView45: Migration = {
    //TODO: @Quixelation, this is incomplete, the vehicles are missing their operationalSectionPosition set to null
    action: null,
    state: (state) => {
        const typedState = state as {
            operationalSections: { [key in UUID]: any };
        };

        typedState.operationalSections ??= {};
    },
};
