import { z } from 'zod';
import type { Immutable } from 'immer';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import type { ActionReducer } from '../action-reducer.js';
import { mapCoordinatesSchema } from '../../models/utils/position/map-coordinates.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { removeInvalidAssignments } from '../../state-helpers/technical-challenge-assignment.js';
import { personnelSchema } from '../../models/personnel.js';

const movePersonnelActionSchema = z.strictObject({
    type: z.literal('[Personnel] Move personnel'),
    personnelId: personnelSchema.shape.id,
    targetPosition: mapCoordinatesSchema,
});
export type MovePersonnelAction = Immutable<
    z.infer<typeof movePersonnelActionSchema>
>;

export namespace PersonnelActionReducers {
    export const movePersonnel: ActionReducer<MovePersonnelAction> = {
        type: movePersonnelActionSchema.shape.type.value,
        actionSchema: movePersonnelActionSchema,
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
