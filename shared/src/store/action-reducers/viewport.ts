import { z } from 'zod';
import type { Immutable } from 'immer';
import {
    changePosition,
    changePositionWithId,
} from '../../models/utils/position/position-helpers-mutable.js';
import type { ActionReducer } from '../action-reducer.js';
import { viewportSchema } from '../../models/viewport.js';
import { uuidSchema } from '../../utils/uuid.js';
import { mapCoordinatesSchema } from '../../models/utils/position/map-coordinates.js';
import { sizeSchema } from '../../models/utils/size.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { getElement } from './utils/get-element.js';

const addViewportActionSchema = z.strictObject({
    type: z.literal('[Viewport] Add viewport'),
    viewport: viewportSchema,
});
export type AddViewportAction = Immutable<
    z.infer<typeof addViewportActionSchema>
>;

const removeViewportActionSchema = z.strictObject({
    type: z.literal('[Viewport] Remove viewport'),
    viewportId: uuidSchema,
});
export type RemoveViewportAction = Immutable<
    z.infer<typeof removeViewportActionSchema>
>;

const moveViewportActionSchema = z.strictObject({
    type: z.literal('[Viewport] Move viewport'),
    viewportId: uuidSchema,
    targetPosition: mapCoordinatesSchema,
});

export type MoveViewportAction = Immutable<
    z.infer<typeof moveViewportActionSchema>
>;

const resizeViewportActionSchema = z.strictObject({
    type: z.literal('[Viewport] Resize viewport'),
    viewportId: viewportSchema.shape.id,
    targetPosition: mapCoordinatesSchema,
    newSize: sizeSchema,
});
export type ResizeViewportAction = Immutable<
    z.infer<typeof resizeViewportActionSchema>
>;

const renameViewportActionSchema = z.strictObject({
    type: z.literal('[Viewport] Rename viewport'),
    viewportId: viewportSchema.shape.id,
    newName: z.string(),
});
export type RenameViewportAction = Immutable<
    z.infer<typeof renameViewportActionSchema>
>;

export namespace ViewportActionReducers {
    export const addViewport: ActionReducer<AddViewportAction> = {
        type: addViewportActionSchema.shape.type.value,
        actionSchema: addViewportActionSchema,
        reducer: (draftState, { viewport }) => {
            draftState.viewports[viewport.id] = cloneDeepMutable(viewport);
            return draftState;
        },
        rights: 'trainer',
    };

    export const removeViewport: ActionReducer<RemoveViewportAction> = {
        type: removeViewportActionSchema.shape.type.value,
        actionSchema: removeViewportActionSchema,
        reducer: (draftState, { viewportId }) => {
            getElement(draftState, 'viewport', viewportId);
            delete draftState.viewports[viewportId];
            return draftState;
        },
        rights: 'trainer',
    };

    export const moveViewport: ActionReducer<MoveViewportAction> = {
        type: moveViewportActionSchema.shape.type.value,
        actionSchema: moveViewportActionSchema,
        reducer: (draftState, { viewportId, targetPosition }) => {
            changePositionWithId(
                viewportId,
                newMapPositionAt(targetPosition),
                'viewport',
                draftState
            );
            return draftState;
        },
        rights: 'trainer',
    };

    export const resizeViewport: ActionReducer<ResizeViewportAction> = {
        type: resizeViewportActionSchema.shape.type.value,
        actionSchema: resizeViewportActionSchema,
        reducer: (draftState, { viewportId, targetPosition, newSize }) => {
            const viewport = getElement(draftState, 'viewport', viewportId);
            changePosition(
                viewport,
                newMapPositionAt(targetPosition),
                draftState
            );
            viewport.size = cloneDeepMutable(newSize);
            return draftState;
        },
        rights: 'trainer',
    };

    export const renameViewport: ActionReducer<RenameViewportAction> = {
        type: renameViewportActionSchema.shape.type.value,
        actionSchema: renameViewportActionSchema,
        reducer: (draftState, { viewportId, newName }) => {
            const viewport = getElement(draftState, 'viewport', viewportId);
            viewport.name = newName;
            return draftState;
        },
        rights: 'trainer',
    };
}
