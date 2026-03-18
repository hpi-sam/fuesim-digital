import { IsUUID } from 'class-validator';
import {
    type MapCoordinates,
    newMapPositionAt,
    mapCoordinatesSchema,
} from '../../models/index.js';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import type { UUID } from '../../utils/index.js';
import { uuidValidationOptions } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
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
