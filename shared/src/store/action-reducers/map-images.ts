import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { WritableDraft } from 'immer';
import {
    MapImage,
    type MapCoordinates,
    mapCoordinatesSchema,
    newMapPositionAt,
} from '../../models/index.js';
import { changePosition } from '../../models/utils/position/position-helpers-mutable.js';
import type { ExerciseState } from '../../state.js';
import type { UUID } from '../../utils/index.js';
import {
    assertExhaustiveness,
    cloneDeepMutable,
    uuidValidationOptions,
} from '../../utils/index.js';
import { IsLiteralUnion, IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { getElement } from './utils/index.js';

export class AddMapImageAction implements Action {
    @IsValue('[MapImage] Add MapImage' as const)
    public readonly type = '[MapImage] Add MapImage';

    @ValidateNested()
    @Type(() => MapImage)
    public readonly mapImage!: MapImage;
}

export class MoveMapImageAction implements Action {
    @IsValue('[MapImage] Move MapImage' as const)
    public readonly type = '[MapImage] Move MapImage';

    @IsUUID(4, uuidValidationOptions)
    public readonly mapImageId!: UUID;

    @IsZodSchema(mapCoordinatesSchema)
    public readonly targetPosition!: MapCoordinates;
}

export class ScaleMapImageAction implements Action {
    @IsValue('[MapImage] Scale MapImage' as const)
    public readonly type = '[MapImage] Scale MapImage';

    @IsUUID(4, uuidValidationOptions)
    public readonly mapImageId!: UUID;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    public readonly newHeight?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    public readonly newAspectRatio?: number;
}

export class RemoveMapImageAction implements Action {
    @IsValue('[MapImage] Remove MapImage' as const)
    public readonly type = '[MapImage] Remove MapImage';

    @IsUUID(4, uuidValidationOptions)
    public readonly mapImageId!: UUID;
}

export class SetIsLockedMapImageAction implements Action {
    @IsValue('[MapImage] Set isLocked' as const)
    public readonly type = '[MapImage] Set isLocked';

    @IsUUID(4, uuidValidationOptions)
    public readonly mapImageId!: UUID;

    @IsBoolean()
    public readonly newLocked!: boolean;
}

export class ReconfigureMapImageUrlAction implements Action {
    @IsValue('[MapImage] Reconfigure Url' as const)
    public readonly type = '[MapImage] Reconfigure Url';

    @IsUUID(4, uuidValidationOptions)
    public readonly mapImageId!: UUID;

    /**
     * Data URI or URL of new image
     */
    @IsString()
    public readonly newUrl!: string;
}

type ChangeZIndexActionMode =
    | 'bringToBack'
    | 'bringToFront'
    | 'oneLayerBack'
    | 'oneLayerForward';

export class ChangeZIndexMapImageAction implements Action {
    @IsValue('[MapImage] Change zIndex' as const)
    public readonly type = '[MapImage] Change zIndex';

    @IsUUID(4, uuidValidationOptions)
    public readonly mapImageId!: UUID;

    @IsLiteralUnion({
        bringToBack: true,
        bringToFront: true,
        oneLayerBack: true,
        oneLayerForward: true,
    })
    public readonly mode!: ChangeZIndexActionMode;
}

export namespace MapImagesActionReducers {
    export const addMapImage: ActionReducer<AddMapImageAction> = {
        action: AddMapImageAction,
        reducer: (draftState, { mapImage }) => {
            const newMapImage = cloneDeepMutable(mapImage);
            const allZIndices = getAllZIndices(draftState);
            newMapImage.zIndex =
                allZIndices.length === 0 ? 0 : Math.max(...allZIndices) + 1;
            draftState.mapImages[mapImage.id] = newMapImage;
            return draftState;
        },
        rights: 'trainer',
    };

    export const moveMapImage: ActionReducer<MoveMapImageAction> = {
        action: MoveMapImageAction,
        reducer: (draftState, { mapImageId, targetPosition }) => {
            const mapImage = getElement(draftState, 'mapImage', mapImageId);
            changePosition(
                mapImage,
                newMapPositionAt(targetPosition),
                draftState
            );
            return draftState;
        },
        rights: 'trainer',
    };

    export const scaleMapImage: ActionReducer<ScaleMapImageAction> = {
        action: ScaleMapImageAction,
        reducer: (draftState, { mapImageId, newHeight, newAspectRatio }) => {
            const mapImage = getElement(draftState, 'mapImage', mapImageId);
            if (newHeight) {
                mapImage.image.height = newHeight;
            }
            if (newAspectRatio) {
                mapImage.image.aspectRatio = newAspectRatio;
            }
            return draftState;
        },
        rights: 'trainer',
    };

    export const removeMapImage: ActionReducer<RemoveMapImageAction> = {
        action: RemoveMapImageAction,
        reducer: (draftState, { mapImageId }) => {
            getElement(draftState, 'mapImage', mapImageId);
            delete draftState.mapImages[mapImageId];
            return draftState;
        },
        rights: 'trainer',
    };

    export const reconfigureMapImageUrl: ActionReducer<ReconfigureMapImageUrlAction> =
        {
            action: ReconfigureMapImageUrlAction,
            reducer: (draftState, { mapImageId, newUrl }) => {
                const mapImage = getElement(draftState, 'mapImage', mapImageId);
                mapImage.image.url = newUrl;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setLockedMapImage: ActionReducer<SetIsLockedMapImageAction> = {
        action: SetIsLockedMapImageAction,
        reducer: (draftState, { mapImageId, newLocked }) => {
            const mapImage = getElement(draftState, 'mapImage', mapImageId);
            mapImage.isLocked = newLocked;
            return draftState;
        },
        rights: 'trainer',
    };

    export const changeZIndex: ActionReducer<ChangeZIndexMapImageAction> = {
        action: ChangeZIndexMapImageAction,
        reducer: (draftState, { mapImageId, mode }) => {
            const mapImage = getElement(draftState, 'mapImage', mapImageId);
            switch (mode) {
                case 'bringToFront':
                case 'bringToBack': {
                    const otherZIndices = getAllZIndices(
                        draftState,
                        mapImageId
                    );
                    if (otherZIndices.length === 0) {
                        mapImage.zIndex = 0;
                        break;
                    }
                    mapImage.zIndex =
                        mode === 'bringToFront'
                            ? Math.max(...otherZIndices) + 1
                            : Math.min(...otherZIndices) - 1;
                    break;
                }
                case 'oneLayerForward':
                case 'oneLayerBack':
                    mapImage.zIndex += mode === 'oneLayerForward' ? 1 : -1;
                    break;
                default:
                    assertExhaustiveness(mode);
            }
            return draftState;
        },
        rights: 'trainer',
    };
}

/**
 * @returns the zIndices of all mapImages except {@link mapImageIdToSkip}
 */
function getAllZIndices(
    exerciseState: WritableDraft<ExerciseState>,
    mapImageIdToSkip?: UUID
): number[] {
    return Object.values(exerciseState.mapImages)
        .filter(
            (mapImage) =>
                mapImageIdToSkip === undefined ||
                mapImage.id !== mapImageIdToSkip
        )
        .map((mapImage) => mapImage.zIndex);
}
