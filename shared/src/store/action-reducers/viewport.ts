import { Type } from 'class-transformer';
import { IsString, IsUUID, ValidateNested } from 'class-validator';
import type { MapCoordinates, Size } from '../../models/index.js';
import {
    newMapPositionAt,
    Viewport,
    mapCoordinatesSchema,
    sizeSchema,
} from '../../models/index.js';
import {
    changePosition,
    changePositionWithId,
} from '../../models/utils/position/position-helpers-mutable.js';
import type { UUID } from '../../utils/index.js';
import { cloneDeepMutable, uuidValidationOptions } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { getElement } from './utils/index.js';

export class AddViewportAction implements Action {
    @IsValue('[Viewport] Add viewport' as const)
    readonly type = '[Viewport] Add viewport';
    @ValidateNested()
    @Type(() => Viewport)
    public viewport!: Viewport;
}

export class RemoveViewportAction implements Action {
    @IsValue('[Viewport] Remove viewport' as const)
    public readonly type = '[Viewport] Remove viewport';
    @IsUUID(4, uuidValidationOptions)
    public readonly viewportId!: UUID;
}

export class MoveViewportAction implements Action {
    @IsValue('[Viewport] Move viewport' as const)
    public readonly type = '[Viewport] Move viewport';
    @IsUUID(4, uuidValidationOptions)
    public readonly viewportId!: UUID;
    @IsZodSchema(mapCoordinatesSchema)
    public readonly targetPosition!: MapCoordinates;
}

export class ResizeViewportAction implements Action {
    @IsValue('[Viewport] Resize viewport' as const)
    public readonly type = '[Viewport] Resize viewport';
    @IsUUID(4, uuidValidationOptions)
    public readonly viewportId!: UUID;
    @IsZodSchema(mapCoordinatesSchema)
    public readonly targetPosition!: MapCoordinates;
    @IsZodSchema(sizeSchema)
    public readonly newSize!: Size;
}

export class RenameViewportAction implements Action {
    @IsValue('[Viewport] Rename viewport' as const)
    public readonly type = '[Viewport] Rename viewport';

    @IsUUID(4, uuidValidationOptions)
    public readonly viewportId!: UUID;

    @IsString()
    public readonly newName!: string;
}

export namespace ViewportActionReducers {
    export const addViewport: ActionReducer<AddViewportAction> = {
        action: AddViewportAction,
        reducer: (draftState, { viewport }) => {
            draftState.viewports[viewport.id] = cloneDeepMutable(viewport);
            return draftState;
        },
        rights: 'trainer',
    };

    export const removeViewport: ActionReducer<RemoveViewportAction> = {
        action: RemoveViewportAction,
        reducer: (draftState, { viewportId }) => {
            getElement(draftState, 'viewport', viewportId);
            delete draftState.viewports[viewportId];
            return draftState;
        },
        rights: 'trainer',
    };

    export const moveViewport: ActionReducer<MoveViewportAction> = {
        action: MoveViewportAction,
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
        action: ResizeViewportAction,
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
        action: RenameViewportAction,
        reducer: (draftState, { viewportId, newName }) => {
            const viewport = getElement(draftState, 'viewport', viewportId);
            viewport.name = newName;
            return draftState;
        },
        rights: 'trainer',
    };
}
