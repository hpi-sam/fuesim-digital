import type { WritableDraft } from 'immer';
import { defaultMaterialTemplates } from '../../src/data/default-state/material-templates.js';
import type { Position } from '../../src/index.js';
import {
    currentCoordinatesOf,
    isPositionOnMap,
    SpatialTree,
    uuid,
    newMaterialFromTemplate,
} from '../../src/index.js';
import type { ExerciseState } from '../../src/state.js';

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
