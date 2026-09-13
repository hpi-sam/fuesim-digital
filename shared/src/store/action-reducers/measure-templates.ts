import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import { measureTemplateSchema } from '../../models/measure/measures.js';
import type { MeasureTemplate } from '../../models/measure/measures.js';
import { getTemplates } from '../../models/template.js';
import type { ExerciseState } from '../../state.js';
import type { ActionReducer } from '../action-reducer.js';
import { ExpectedReducerError, ReducerError } from '../reducer-error.js';
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
    category: measureTemplateSchema.shape.category,
    properties: measureTemplateSchema.shape.properties,
    replacePrevious: measureTemplateSchema.shape.replacePrevious,
});
export type EditMeasureTemplateAction = Immutable<
    z.infer<typeof editMeasureTemplateActionSchema>
>;

export const changeCategoryOfMeasureTemplateActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplate] Change Category of MeasureTemplate'),
    id: measureTemplateSchema.shape.id,
    categoryName: measureTemplateSchema.shape.category,
});
export type ChangeCategoryOfMeasureTemplateAction = Immutable<
    z.infer<typeof changeCategoryOfMeasureTemplateActionSchema>
>;

export const renameMeasureTemplateCategoryActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplate] Rename Category'),
    previousName: measureTemplateSchema.shape.category,
    newName: measureTemplateSchema.shape.category,
});
export type RenameMeasureTemplateCategoryAction = Immutable<
    z.infer<typeof renameMeasureTemplateCategoryActionSchema>
>;

export const deleteMeasureTemplateCategoryActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplate] Delete Category'),
    name: measureTemplateSchema.shape.category,
});
export type DeleteMeasureTemplateCategoryAction = Immutable<
    z.infer<typeof deleteMeasureTemplateCategoryActionSchema>
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
                { id, name, category, properties, replacePrevious }
            ) => {
                const measureTemplate = getMeasureTemplate(draftState, id);
                measureTemplate.name = name;
                measureTemplate.category = category;
                measureTemplate.properties = cloneDeepMutable(properties);
                measureTemplate.replacePrevious = replacePrevious;
                return draftState;
            },
            rights: 'trainer',
        };

    export const changeCategoryOfMeasureTemplate: ActionReducer<ChangeCategoryOfMeasureTemplateAction> =
        {
            type: changeCategoryOfMeasureTemplateActionSchema.shape.type.value,
            actionSchema: changeCategoryOfMeasureTemplateActionSchema,
            reducer: (draftState, { id, categoryName }) => {
                const measureTemplate = getMeasureTemplate(draftState, id);
                measureTemplate.category = categoryName;
                return draftState;
            },
            rights: 'trainer',
        };

    export const renameMeasureTemplateCategory: ActionReducer<RenameMeasureTemplateCategoryAction> =
        {
            type: renameMeasureTemplateCategoryActionSchema.shape.type.value,
            actionSchema: renameMeasureTemplateCategoryActionSchema,
            reducer: (draftState, { previousName, newName }) => {
                if (previousName === newName) return draftState;

                for (const measureTemplate of Object.values(
                    getTemplates(draftState, 'measureTemplate')
                )) {
                    if (measureTemplate.category === previousName) {
                        measureTemplate.category = newName;
                    }
                }
                return draftState;
            },
            rights: 'trainer',
        };

    export const deleteMeasureTemplateCategory: ActionReducer<DeleteMeasureTemplateCategoryAction> =
        {
            type: deleteMeasureTemplateCategoryActionSchema.shape.type.value,
            actionSchema: deleteMeasureTemplateCategoryActionSchema,
            reducer: (draftState, { name }) => {
                const templates = Object.values(
                    getTemplates(draftState, 'measureTemplate')
                );
                const otherCategoryName = [
                    ...new Set(templates.map((template) => template.category)),
                ]
                    .filter((categoryName) => categoryName !== name)
                    .sort((a, b) => a.localeCompare(b))[0];
                if (otherCategoryName === undefined) {
                    throw new ExpectedReducerError(
                        `Die Kategorie "${name}" kann nicht gelöscht werden, da keine andere Kategorie existiert, in die ihre Maßnahmen verschoben werden könnten.`
                    );
                }
                for (const template of templates) {
                    if (template.category === name) {
                        template.category = otherCategoryName;
                    }
                }
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
