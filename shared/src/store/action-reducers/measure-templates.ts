import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import { measureTemplateSchema } from '../../models/measure/measures.js';
import type { MeasureTemplate } from '../../models/measure/measures.js';
import { getTemplates } from '../../models/template.js';
import type { ExerciseState } from '../../state.js';
import type { ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { type UUID } from '../../utils/uuid.js';

export const addMeasureTemplateActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplate] Add MeasureTemplate'),
    measureTemplate: measureTemplateSchema,
});
export type AddMeasureTemplateAction = Immutable<
    z.infer<typeof addMeasureTemplateActionSchema>
>;

export const editMeasureTemplateActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplate] Edit MeasureTemplate'),
    id: measureTemplateSchema.shape.id,
    name: measureTemplateSchema.shape.name,
    properties: measureTemplateSchema.shape.properties,
    replacePrevious: measureTemplateSchema.shape.replacePrevious,
});
export type EditMeasureTemplateAction = Immutable<
    z.infer<typeof editMeasureTemplateActionSchema>
>;

export const removeMeasureTemplateActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplate] Remove MeasureTemplate'),
    id: measureTemplateSchema.shape.id,
});
export type RemoveMeasureTemplateAction = Immutable<
    z.infer<typeof removeMeasureTemplateActionSchema>
>;

export namespace MeasureTemplateActionReducers {
    export const addMeasureTemplate: ActionReducer<AddMeasureTemplateAction> = {
        type: addMeasureTemplateActionSchema.shape.type.value,
        actionSchema: addMeasureTemplateActionSchema,
        reducer: (draftState, { measureTemplate }) => {
            if (
                getTemplates(draftState, 'measureTemplate')[measureTemplate.id]
            ) {
                throw new ReducerError(
                    `MeasureTemplate with id ${measureTemplate.id} already exists`
                );
            }
            draftState.templates[measureTemplate.id] =
                cloneDeepMutable(measureTemplate);
            return draftState;
        },
        rights: 'trainer',
    };

    export const editMeasureTemplate: ActionReducer<EditMeasureTemplateAction> =
        {
            type: editMeasureTemplateActionSchema.shape.type.value,
            actionSchema: editMeasureTemplateActionSchema,
            reducer: (
                draftState,
                { id, name, properties, replacePrevious }
            ) => {
                const measureTemplate = getMeasureTemplate(draftState, id);
                measureTemplate.name = name;
                measureTemplate.properties = cloneDeepMutable(properties);
                measureTemplate.replacePrevious = replacePrevious;
                return draftState;
            },
            rights: 'trainer',
        };

    export const removeMeasureTemplate: ActionReducer<RemoveMeasureTemplateAction> =
        {
            type: removeMeasureTemplateActionSchema.shape.type.value,
            actionSchema: removeMeasureTemplateActionSchema,
            reducer: (draftState, { id }) => {
                getMeasureTemplate(draftState, id);
                delete draftState.templates[id];
                return draftState;
            },
            rights: 'trainer',
        };
}

export function getMeasureTemplate(
    state: WritableDraft<ExerciseState>,
    id: UUID
): WritableDraft<MeasureTemplate> {
    const measureTemplate = getTemplates(state, 'measureTemplate')[id];
    if (!measureTemplate) {
        throw new ReducerError(`MeasureTemplate with id ${id} does not exist`);
    }
    return measureTemplate;
}
