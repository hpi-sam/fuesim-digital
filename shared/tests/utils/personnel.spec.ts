import type { WritableDraft } from 'immer';
import type { Personnel } from '../../src/models/personnel.js';
import type { ExerciseState } from '../../src/state.js';
import { cloneDeepMutable } from '../../src/utils/clone-deep.js';
import {
    currentCoordinatesOf,
    isOnMap,
} from '../../src/models/utils/position/position-helpers.js';
import { SpatialTree } from '../../src/models/utils/spatial-tree.js';

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
