import { IsUUID } from 'class-validator';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { type UUID, uuidValidationOptions } from '../../utils/uuid.js';
import {
    type MapCoordinates,
    mapCoordinatesSchema,
} from '../../models/utils/position/map-coordinates.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { removeInvalidAssignments } from '../../state-helpers/technical-challenge-assignment.js';

export class MovePersonnelAction implements Action {
    @IsValue('[Personnel] Move personnel' as const)
    public readonly type = '[Personnel] Move personnel';

    @IsUUID(4, uuidValidationOptions)
    public readonly personnelId!: UUID;

    @IsZodSchema(mapCoordinatesSchema)
    public readonly targetPosition!: MapCoordinates;
}

export namespace PersonnelActionReducers {
    export const movePersonnel: ActionReducer<MovePersonnelAction> = {
        action: MovePersonnelAction,
        reducer: (draftState, { personnelId, targetPosition }) => {
            changePositionWithId(
                personnelId,
                newMapPositionAt(targetPosition),
                'personnel',
                draftState
            );

            removeInvalidAssignments(personnelId, draftState);

            return draftState;
        },
        rights: 'participant',
    };
}
