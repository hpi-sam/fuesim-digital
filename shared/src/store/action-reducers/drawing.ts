import * as z from 'zod';
import type { Immutable } from 'immer';
import type { ActionReducer } from '../action-reducer.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { drawingSchema } from '../../models/drawing.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { ReducerError } from '../reducer-error.js';

export const addDrawingActionSchema = z.strictObject({
    type: z.literal('[Drawing] Add drawing'),
    drawing: drawingSchema,
});
export type AddDrawingAction = Immutable<
    z.infer<typeof addDrawingActionSchema>
>;

export const moveDrawingActionSchema = z.strictObject({
    type: z.literal('[Drawing] Move drawing'),
    drawingId: drawingSchema.shape.id,
    newPoints: drawingSchema.shape.points,
});
export type MoveDrawingAction = Immutable<
    z.infer<typeof moveDrawingActionSchema>
>;

export const removeDrawingActionSchema = z.strictObject({
    type: z.literal('[Drawing] Remove drawing'),
    drawingId: drawingSchema.shape.id,
});
export type RemoveDrawingAction = Immutable<
    z.infer<typeof removeDrawingActionSchema>
>;

export namespace DrawingActionReducers {
    export const addDrawing: ActionReducer<AddDrawingAction> = {
        type: addDrawingActionSchema.shape.type.value,
        actionSchema: addDrawingActionSchema,
        reducer: (draftState, { drawing }) => {
            draftState.drawings[drawing.id] = cloneDeepMutable(drawing);
            return draftState;
        },
        rights: 'participant',
    };

    export const moveDrawing: ActionReducer<MoveDrawingAction> = {
        type: moveDrawingActionSchema.shape.type.value,
        actionSchema: moveDrawingActionSchema,
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
        type: removeDrawingActionSchema.shape.type.value,
        actionSchema: removeDrawingActionSchema,
        reducer: (draftState, { drawingId }) => {
            delete draftState.drawings[drawingId];
            return draftState;
        },
        rights: 'participant',
    };
}
