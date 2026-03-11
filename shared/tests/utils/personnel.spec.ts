import type { WritableDraft } from 'immer';
import type { Personnel } from '../../src/index.js';
import {
    currentCoordinatesOf,
    isOnMap,
    SpatialTree,
    cloneDeepMutable,
} from '../../src/index.js';
import type { ExerciseState } from '../../src/state.js';

export function addPersonnel(
    state: WritableDraft<ExerciseState>,
    personnel: Personnel
) {
    const mutablePersonnel = cloneDeepMutable(personnel);
    if (isOnMap(mutablePersonnel)) {
        SpatialTree.addElement(
            state.spatialTrees.personnel,
            personnel.id,
            currentCoordinatesOf(personnel)
        );
    }
    state.personnel[personnel.id] = mutablePersonnel;
    return personnel;
}
