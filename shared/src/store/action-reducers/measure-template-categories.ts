import { z } from 'zod';
import {
    measureTemplateCategorySchema,
    newMeasureTemplateCategory,
} from '../../models/measure/measures.js';
import type { ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { getCategory } from './utils/measures.js';

export const addMeasureTemplateCategoryActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplateCategory] Add MeasureTemplateCategory'),
    name: measureTemplateCategorySchema.shape.name,
});
export type AddMeasureTemplateCategoryAction = z.infer<
    typeof addMeasureTemplateCategoryActionSchema
>;

export const renameMeasureTemplateCategoryActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplateCategory] Rename MeasureTemplateCategory'),
    previousName: measureTemplateCategorySchema.shape.name,
    newName: measureTemplateCategorySchema.shape.name,
});
export type RenameMeasureTemplateCategoryAction = z.infer<
    typeof renameMeasureTemplateCategoryActionSchema
>;

export const removeMeasureTemplateCategoryActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplateCategory] Remove MeasureTemplateCategory'),
    name: measureTemplateCategorySchema.shape.name,
});
export type RemoveMeasureTemplateCategoryAction = z.infer<
    typeof removeMeasureTemplateCategoryActionSchema
>;

export namespace MeasureTemplateActionReducers {
    export const addMeasureTemplateCategory: ActionReducer<AddMeasureTemplateCategoryAction> =
        {
            type: '[MeasureTemplateCategory] Add MeasureTemplateCategory',
            actionSchema: addMeasureTemplateCategoryActionSchema,
            reducer: (draftState, { name }) => {
                if (draftState.measureTemplates[name] !== undefined) {
                    throw new ReducerError(
                        `MeasureTemplateCategory with name ${name} already exist`
                    );
                }
                draftState.measureTemplates[name] = newMeasureTemplateCategory(
                    name,
                    []
                );
                return draftState;
            },
            rights: 'trainer',
        };
    export const renameMeasureTemplateCategory: ActionReducer<RenameMeasureTemplateCategoryAction> =
        {
            type: '[MeasureTemplateCategory] Rename MeasureTemplateCategory',
            actionSchema: renameMeasureTemplateCategoryActionSchema,
            reducer: (draftState, { previousName, newName }) => {
                if (previousName === newName) return draftState;

                const category = getCategory(draftState, previousName);
                category.name = newName;
                delete draftState.measureTemplates[previousName];
                draftState.measureTemplates[newName] = category;

                return draftState;
            },
            rights: 'trainer',
        };
    export const removeMeasureTemplateCategory: ActionReducer<RemoveMeasureTemplateCategoryAction> =
        {
            type: '[MeasureTemplateCategory] Remove MeasureTemplateCategory',
            actionSchema: removeMeasureTemplateCategoryActionSchema,
            reducer: (draftState, { name }) => {
                if (Object.entries(draftState.measureTemplates).length === 1) {
                    throw new ReducerError(
                        `Die letzte Maßnahmen-Kategorie kann nicht entfernt werden`
                    );
                }
                const category = getCategory(draftState, name);
                const templates = category.templates;
                delete draftState.measureTemplates[name];
                const otherCategory = Object.values(
                    draftState.measureTemplates
                )[0]!;
                otherCategory.templates = {
                    ...templates,
                    ...otherCategory.templates,
                };
                return draftState;
            },
            rights: 'trainer',
        };
}
