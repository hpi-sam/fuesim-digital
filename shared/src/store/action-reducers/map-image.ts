import type { WritableDraft, Immutable } from 'immer';
import { z } from 'zod';
import { changePosition } from '../../models/utils/position/position-helpers-mutable.js';
import type { ExerciseState } from '../../state.js';
import type { ActionReducer } from '../action-reducer.js';
import { mapImageSchema } from '../../models/map-image.js';
import { type UUID } from '../../utils/uuid.js';
import { mapCoordinatesSchema } from '../../models/utils/position/map-coordinates.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { assertExhaustiveness } from '../../utils/assert-exhaustiveness.js';
import { getElement } from './utils/get-element.js';

export const addMapImageActionSchema = z.strictObject({
    type: z.literal('[MapImage] Add MapImage'),
    mapImage: mapImageSchema,
});
export type AddMapImageAction = Immutable<
    z.infer<typeof addMapImageActionSchema>
>;

export const moveMapImageActionSchema = z.strictObject({
    type: z.literal('[MapImage] Move MapImage'),
    mapImageId: mapImageSchema.shape.id,
    targetPosition: mapCoordinatesSchema,
});
export type MoveMapImageAction = Immutable<
    z.infer<typeof moveMapImageActionSchema>
>;

export const scaleMapImageActionSchema = z.strictObject({
    type: z.literal('[MapImage] Scale MapImage'),
    mapImageId: mapImageSchema.shape.id,
    newHeight: mapImageSchema.shape.image.shape.height.optional(),
    newAspectRatio: mapImageSchema.shape.image.shape.aspectRatio.optional(),
});
export type ScaleMapImageAction = Immutable<
    z.infer<typeof scaleMapImageActionSchema>
>;

export const removeMapImageActionSchema = z.strictObject({
    type: z.literal('[MapImage] Remove MapImage'),
    mapImageId: mapImageSchema.shape.id,
});
export type RemoveMapImageAction = Immutable<
    z.infer<typeof removeMapImageActionSchema>
>;

export const setIsLockedMapImageActionSchema = z.strictObject({
    type: z.literal('[MapImage] Set isLocked'),
    mapImageId: mapImageSchema.shape.id,
    newLocked: mapImageSchema.shape.isLocked,
});
export type SetIsLockedMapImageAction = Immutable<
    z.infer<typeof setIsLockedMapImageActionSchema>
>;

export const reconfigureMapImageUrlActionSchema = z.strictObject({
    type: z.literal('[MapImage] Reconfigure Url'),
    mapImageId: mapImageSchema.shape.id,
    /**
     * Data URI or URL of new image
     */
    newUrl: mapImageSchema.shape.image.shape.url,
});
export type ReconfigureMapImageUrlAction = Immutable<
    z.infer<typeof reconfigureMapImageUrlActionSchema>
>;

const changeZIndexActionModeSchema = z.literal([
    'bringToBack',
    'bringToFront',
    'oneLayerBack',
    'oneLayerForward',
]);

export const changeZIndexMapImageActionSchema = z.strictObject({
    type: z.literal('[MapImage] Change zIndex'),
    mapImageId: mapImageSchema.shape.id,
    mode: changeZIndexActionModeSchema,
});
export type ChangeZIndexMapImageAction = Immutable<
    z.infer<typeof changeZIndexMapImageActionSchema>
>;

export namespace MapImagesActionReducers {
    export const addMapImage: ActionReducer<AddMapImageAction> = {
        type: addMapImageActionSchema.shape.type.value,
        actionSchema: addMapImageActionSchema,
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
        type: moveMapImageActionSchema.shape.type.value,
        actionSchema: moveMapImageActionSchema,
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
        type: '[MapImage] Scale MapImage',
        actionSchema: scaleMapImageActionSchema,
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
        type: removeMapImageActionSchema.shape.type.value,
        actionSchema: removeMapImageActionSchema,
        reducer: (draftState, { mapImageId }) => {
            getElement(draftState, 'mapImage', mapImageId);
            delete draftState.mapImages[mapImageId];
            return draftState;
        },
        rights: 'trainer',
    };

    export const reconfigureMapImageUrl: ActionReducer<ReconfigureMapImageUrlAction> =
        {
            type: reconfigureMapImageUrlActionSchema.shape.type.value,
            actionSchema: reconfigureMapImageUrlActionSchema,
            reducer: (draftState, { mapImageId, newUrl }) => {
                const mapImage = getElement(draftState, 'mapImage', mapImageId);
                mapImage.image.url = newUrl;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setLockedMapImage: ActionReducer<SetIsLockedMapImageAction> = {
        type: setIsLockedMapImageActionSchema.shape.type.value,
        actionSchema: setIsLockedMapImageActionSchema,
        reducer: (draftState, { mapImageId, newLocked }) => {
            const mapImage = getElement(draftState, 'mapImage', mapImageId);
            mapImage.isLocked = newLocked;
            return draftState;
        },
        rights: 'trainer',
    };

    export const changeZIndex: ActionReducer<ChangeZIndexMapImageAction> = {
        type: changeZIndexMapImageActionSchema.shape.type.value,
        actionSchema: changeZIndexMapImageActionSchema,
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
