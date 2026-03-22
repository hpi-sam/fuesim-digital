import type { WritableDraft } from 'immer';
import { defaultMaterialTemplates } from '../../src/data/default-state/material-templates.js';
import type { ExerciseState } from '../../src/state.js';
import type { Position } from '../../src/models/utils/position/position.js';
import { newMaterialFromTemplate } from '../../src/models/material.js';
import {
    currentCoordinatesOf,
    isPositionOnMap,
} from '../../src/models/utils/position/position-helpers.js';
import { SpatialTree } from '../../src/models/utils/spatial-tree.js';
import { uuid } from '../../src/utils/uuid.js';

export function addMaterial(
    state: WritableDraft<ExerciseState>,
    position: Position
) {
    const material = newMaterialFromTemplate(
        defaultMaterialTemplates.standard,
        uuid(),
        'RTW 3/83/1',
        position
    );

    material.canCaterFor = {
        red: 1,
        yellow: 0,
        green: 0,
        logicalOperator: 'and',
    };
    if (isPositionOnMap(position)) {
        SpatialTree.addElement(
            state.spatialTrees.materials,
            material.id,
            currentCoordinatesOf(material)
        );
    }
    state.materials[material.id] = material;
    return material;
}
