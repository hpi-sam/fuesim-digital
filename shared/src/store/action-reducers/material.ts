import { IsUUID } from 'class-validator';
import type { Action, ActionReducer } from '../action-reducer.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { type UUID, uuidValidationOptions } from '../../utils/uuid.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {
    type MapCoordinates,
    mapCoordinatesSchema,
} from '../../models/utils/position/map-coordinates.js';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';

export class MoveMaterialAction implements Action {
    @IsValue('[Material] Move material' as const)
    public readonly type = '[Material] Move material';

    @IsUUID(4, uuidValidationOptions)
    public readonly materialId!: UUID;

    @IsZodSchema(mapCoordinatesSchema)
    public readonly targetPosition!: MapCoordinates;
}

export namespace MaterialActionReducers {
    export const moveMaterial: ActionReducer<MoveMaterialAction> = {
        action: MoveMaterialAction,
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
