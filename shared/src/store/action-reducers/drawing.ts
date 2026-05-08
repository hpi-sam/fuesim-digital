import * as z from 'zod';
import { Action, ActionReducer } from '../action-reducer.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { type Drawing, drawingSchema } from '../../models/drawing.js';
import {
    type MapCoordinates,
    mapCoordinatesSchema,
} from '../../models/utils/position/map-coordinates.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { ReducerError } from '../reducer-error.js';

export class AddDrawingAction implements Action {
    @IsValue('[Drawing] Add drawing' as const)
    public readonly type = '[Drawing] Add drawing';

    @IsZodSchema(drawingSchema)
    public readonly drawing!: Drawing;
}

export class MoveDrawingAction implements Action {
    @IsValue('[Drawing] Move drawing' as const)
    public readonly type = '[Drawing] Move drawing';

    @IsZodSchema(uuidSchema)
    public readonly drawingId!: UUID;

    @IsZodSchema(z.array(mapCoordinatesSchema).min(2))
    public readonly newPoints!: readonly MapCoordinates[];
}

export class RemoveDrawingAction implements Action {
    @IsValue('[Drawing] Remove drawing' as const)
    public readonly type = '[Drawing] Remove drawing';

    @IsZodSchema(uuidSchema)
    public readonly drawingId!: UUID;
}

export namespace DrawingActionReducers {
    export const addDrawing: ActionReducer<AddDrawingAction> = {
        action: AddDrawingAction,
        reducer: (draftState, { drawing }) => {
            draftState.drawings[drawing.id] = cloneDeepMutable(drawing);
            return draftState;
        },
        rights: 'participant',
    };

    export const moveDrawing: ActionReducer<MoveDrawingAction> = {
        action: MoveDrawingAction,
        reducer: (draftState, { drawingId, newPoints }) => {
            if (newPoints.length < 2) {
                throw new ReducerError(
                    'At least two points are needed for a drawing.'
                );
            }
            const drawing = draftState.drawings[drawingId];
            if (drawing === undefined) {
                return draftState;
            }

            const firstPoint = newPoints[0];
            if (firstPoint === undefined) {
                return draftState;
            }

            drawing.points = cloneDeepMutable(newPoints);
            drawing.position = newMapPositionAt(firstPoint);
            return draftState;
        },
        rights: 'participant',
    };

    export const removeDrawing: ActionReducer<RemoveDrawingAction> = {
        action: RemoveDrawingAction,
        reducer: (draftState, { drawingId }) => {
            delete draftState.drawings[drawingId];
            return draftState;
        },
        rights: 'participant',
    };
}
