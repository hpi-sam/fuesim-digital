import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ActionReducer } from '../action-reducer.js';
import { mapCoordinatesSchema } from '../../models/utils/position/map-coordinates.js';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { materialSchema } from '../../models/material.js';

export const moveMaterialActionSchema = z.strictObject({
    type: z.literal('[Material] Move material'),
    materialId: materialSchema.shape.id,
    targetPosition: mapCoordinatesSchema,
});
export type MoveMaterialAction = Immutable<
    z.infer<typeof moveMaterialActionSchema>
>;

export namespace MaterialActionReducers {
    export const moveMaterial: ActionReducer<MoveMaterialAction> = {
        type: '[Material] Move material',
        actionSchema: moveMaterialActionSchema,
        reducer: (draftState, { materialId, targetPosition }) => {
            changePositionWithId(
                materialId,
                newMapPositionAt(targetPosition),
                'material',
                draftState
            );
            return draftState;
        },
        rights: 'participant',
    };
}
