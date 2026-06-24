import type { WritableDraft, Immutable } from 'immer';
import { z } from 'zod';
import type { ExerciseState } from '../../state.js';
import type { ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import {
    type MapImageTemplate,
    mapImageTemplateSchema,
} from '../../models/map-image-template.js';
import { type UUID } from '../../utils/uuid.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';

export const addMapImageTemplateActionSchema = z.strictObject({
    type: z.literal('[MapImageTemplate] Add mapImageTemplate'),
    mapImageTemplate: mapImageTemplateSchema,
});
export type AddMapImageTemplateAction = Immutable<
    z.infer<typeof addMapImageTemplateActionSchema>
>;

export const editMapImageTemplateActionSchema = z.strictObject({
    type: z.literal('[MapImageTemplate] Edit mapImageTemplate'),
    id: mapImageTemplateSchema.shape.id,
    name: mapImageTemplateSchema.shape.name,
    image: mapImageTemplateSchema.shape.image,
});
export type EditMapImageTemplateAction = Immutable<
    z.infer<typeof editMapImageTemplateActionSchema>
>;

export const deleteMapImageTemplateActionSchema = z.strictObject({
    type: z.literal('[MapImageTemplate] Delete mapImageTemplate'),
    id: mapImageTemplateSchema.shape.id,
});
export type DeleteMapImageTemplateAction = Immutable<
    z.infer<typeof deleteMapImageTemplateActionSchema>
>;

export namespace MapImageTemplatesActionReducers {
    export const addMapImageTemplate: ActionReducer<AddMapImageTemplateAction> =
        {
            type: addMapImageTemplateActionSchema.shape.type.value,
            actionSchema: addMapImageTemplateActionSchema,
            reducer: (draftState, { mapImageTemplate }) => {
                if (draftState.mapImageTemplates[mapImageTemplate.id]) {
                    throw new ReducerError(
                        `MapImageTemplate with id ${mapImageTemplate.id} already exists`
                    );
                }
                draftState.mapImageTemplates[mapImageTemplate.id] =
                    cloneDeepMutable(mapImageTemplate);
                return draftState;
            },
            rights: 'trainer',
        };

    export const editMapImageTemplate: ActionReducer<EditMapImageTemplateAction> =
        {
            type: editMapImageTemplateActionSchema.shape.type.value,
            actionSchema: editMapImageTemplateActionSchema,
            reducer: (draftState, { id, name, image }) => {
                const mapImageTemplate = getMapImageTemplate(draftState, id);
                mapImageTemplate.name = name;
                mapImageTemplate.image = cloneDeepMutable(image);
                return draftState;
            },
            rights: 'trainer',
        };

    export const deleteMapImageTemplate: ActionReducer<DeleteMapImageTemplateAction> =
        {
            type: deleteMapImageTemplateActionSchema.shape.type.value,
            actionSchema: deleteMapImageTemplateActionSchema,
            reducer: (draftState, { id }) => {
                getMapImageTemplate(draftState, id);
                delete draftState.mapImageTemplates[id];
                return draftState;
            },
            rights: 'trainer',
        };
}

function getMapImageTemplate(
    state: WritableDraft<ExerciseState>,
    id: UUID
): WritableDraft<MapImageTemplate> {
    const mapImageTemplate = state.mapImageTemplates[id];
    if (!mapImageTemplate) {
        throw new ReducerError(`MapImageTemplate with id ${id} does not exist`);
    }
    return mapImageTemplate;
}
