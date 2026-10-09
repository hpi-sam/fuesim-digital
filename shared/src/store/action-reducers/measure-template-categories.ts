import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import {
    measureTemplateSchema,
    newMeasureTemplateCategory,
} from '../../models/measure/measures.js';
import type { MeasureTemplate } from '../../models/measure/measures.js';
import type { ExerciseState } from '../../state.js';
import type { ActionReducer } from '../action-reducer.js';
import { ExpectedReducerError, ReducerError } from '../reducer-error.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { type UUID } from '../../utils/uuid.js';

const categoryNameSchema = z.string().nonempty();

export const addMeasureTemplateCategoryActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplateCategory] Add Category'),
    name: categoryNameSchema,
});
export type AddMeasureTemplateCategoryAction = Immutable<
    z.infer<typeof addMeasureTemplateCategoryActionSchema>
>;

export const renameMeasureTemplateCategoryActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplateCategory] Rename Category'),
    previousName: categoryNameSchema,
    newName: categoryNameSchema,
});
export type RenameMeasureTemplateCategoryAction = Immutable<
    z.infer<typeof renameMeasureTemplateCategoryActionSchema>
>;

export const deleteMeasureTemplateCategoryActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplateCategory] Delete Category'),
    name: categoryNameSchema,
});
export type DeleteMeasureTemplateCategoryAction = Immutable<
    z.infer<typeof deleteMeasureTemplateCategoryActionSchema>
>;

export const addTemplateToCategoryActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplateCategory] Add Template To Category'),
    categoryName: categoryNameSchema,
    measureTemplate: measureTemplateSchema,
});
export type AddTemplateToCategoryAction = Immutable<
    z.infer<typeof addTemplateToCategoryActionSchema>
>;

export const moveTemplateToCategoryActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplateCategory] Move Template To Category'),
    id: measureTemplateSchema.shape.id,
    previousCategoryName: categoryNameSchema,
    newCategoryName: categoryNameSchema,
});
export type MoveTemplateToCategoryAction = Immutable<
    z.infer<typeof moveTemplateToCategoryActionSchema>
>;

export const editCategorizedMeasureTemplateActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplateCategory] Edit Categorized Template'),
    categoryName: categoryNameSchema,
    id: measureTemplateSchema.shape.id,
    name: measureTemplateSchema.shape.name,
    properties: measureTemplateSchema.shape.properties,
    replacePrevious: measureTemplateSchema.shape.replacePrevious,
});
export type EditCategorizedMeasureTemplateAction = Immutable<
    z.infer<typeof editCategorizedMeasureTemplateActionSchema>
>;

export const removeCategorizedMeasureTemplateActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplateCategory] Remove Categorized Template'),
    categoryName: categoryNameSchema,
    id: measureTemplateSchema.shape.id,
});
export type RemoveCategorizedMeasureTemplateAction = Immutable<
    z.infer<typeof removeCategorizedMeasureTemplateActionSchema>
>;

export namespace MeasureTemplateCategoryActionReducers {
    export const addMeasureTemplateCategory: ActionReducer<AddMeasureTemplateCategoryAction> =
        {
            type: addMeasureTemplateCategoryActionSchema.shape.type.value,
            actionSchema: addMeasureTemplateCategoryActionSchema,
            reducer: (draftState, { name }) => {
                if (draftState.measureTemplates[name]) {
                    throw new ReducerError(
                        `Category with name ${name} already exists`
                    );
                }
                draftState.measureTemplates[name] = cloneDeepMutable(
                    newMeasureTemplateCategory(name)
                );
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

                const category = getMeasureTemplateCategory(
                    draftState,
                    previousName
                );
                if (draftState.measureTemplates[newName]) {
                    throw new ExpectedReducerError(
                        `Die Kategorie "${newName}" existiert bereits.`
                    );
                }
                category.name = newName;
                draftState.measureTemplates[newName] = category;
                delete draftState.measureTemplates[previousName];
                return draftState;
            },
            rights: 'trainer',
        };

    export const deleteMeasureTemplateCategory: ActionReducer<DeleteMeasureTemplateCategoryAction> =
        {
            type: deleteMeasureTemplateCategoryActionSchema.shape.type.value,
            actionSchema: deleteMeasureTemplateCategoryActionSchema,
            reducer: (draftState, { name }) => {
                getMeasureTemplateCategory(draftState, name);
                delete draftState.measureTemplates[name];
                return draftState;
            },
            rights: 'trainer',
        };

    export const addTemplateToCategory: ActionReducer<AddTemplateToCategoryAction> =
        {
            type: addTemplateToCategoryActionSchema.shape.type.value,
            actionSchema: addTemplateToCategoryActionSchema,
            reducer: (draftState, { categoryName, measureTemplate }) => {
                draftState.measureTemplates[categoryName] ??= cloneDeepMutable(
                    newMeasureTemplateCategory(categoryName)
                );
                draftState.measureTemplates[categoryName].templates[
                    measureTemplate.id
                ] = cloneDeepMutable(measureTemplate);
                return draftState;
            },
            rights: 'trainer',
        };

    export const moveTemplateToCategory: ActionReducer<MoveTemplateToCategoryAction> =
        {
            type: moveTemplateToCategoryActionSchema.shape.type.value,
            actionSchema: moveTemplateToCategoryActionSchema,
            reducer: (
                draftState,
                { id, previousCategoryName, newCategoryName }
            ) => {
                if (previousCategoryName === newCategoryName) {
                    return draftState;
                }
                const measureTemplate = getCategorizedMeasureTemplate(
                    draftState,
                    previousCategoryName,
                    id
                );
                draftState.measureTemplates[newCategoryName] ??=
                    cloneDeepMutable(
                        newMeasureTemplateCategory(newCategoryName)
                    );
                draftState.measureTemplates[newCategoryName].templates[id] =
                    measureTemplate;
                delete getMeasureTemplateCategory(
                    draftState,
                    previousCategoryName
                ).templates[id];
                return draftState;
            },
            rights: 'trainer',
        };

    export const editCategorizedMeasureTemplate: ActionReducer<EditCategorizedMeasureTemplateAction> =
        {
            type: editCategorizedMeasureTemplateActionSchema.shape.type.value,
            actionSchema: editCategorizedMeasureTemplateActionSchema,
            reducer: (
                draftState,
                { categoryName, id, name, properties, replacePrevious }
            ) => {
                const measureTemplate = getCategorizedMeasureTemplate(
                    draftState,
                    categoryName,
                    id
                );
                measureTemplate.name = name;
                measureTemplate.properties = cloneDeepMutable(properties);
                measureTemplate.replacePrevious = replacePrevious;
                return draftState;
            },
            rights: 'trainer',
        };

    export const removeCategorizedMeasureTemplate: ActionReducer<RemoveCategorizedMeasureTemplateAction> =
        {
            type: removeCategorizedMeasureTemplateActionSchema.shape.type.value,
            actionSchema: removeCategorizedMeasureTemplateActionSchema,
            reducer: (draftState, { categoryName, id }) => {
                const category = getMeasureTemplateCategory(
                    draftState,
                    categoryName
                );
                getCategorizedMeasureTemplate(draftState, categoryName, id);
                delete category.templates[id];
                return draftState;
            },
            rights: 'trainer',
        };
}

function getMeasureTemplateCategory(
    state: WritableDraft<ExerciseState>,
    categoryName: string
) {
    const category = state.measureTemplates[categoryName];
    if (!category) {
        throw new ReducerError(
            `MeasureTemplate category with name ${categoryName} does not exist`
        );
    }
    return category;
}

export function getCategorizedMeasureTemplate(
    state: WritableDraft<ExerciseState>,
    categoryName: string,
    id: UUID
): WritableDraft<MeasureTemplate> {
    const measureTemplate = getMeasureTemplateCategory(state, categoryName)
        .templates[id];
    if (!measureTemplate) {
        throw new ReducerError(
            `MeasureTemplate with id ${id} does not exist in category ${categoryName}`
        );
    }
    return measureTemplate;
}

/**
 * Searches every category for a {@link MeasureTemplate} instance with the given id.
 */
export function findCategorizedMeasureTemplate(
    state: WritableDraft<ExerciseState>,
    id: UUID
): WritableDraft<MeasureTemplate> | undefined {
    for (const category of Object.values(state.measureTemplates)) {
        const measureTemplate = category.templates[id];
        if (measureTemplate) {
            return measureTemplate;
        }
    }
    return undefined;
}
