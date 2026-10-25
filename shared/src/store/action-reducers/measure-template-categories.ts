import { z } from 'zod';
import { castDraft } from 'immer';
import {
    measureTemplateCategorySchema,
    newMeasureTemplateCategory,
} from '../../models/measure/measures.js';
import type { ActionReducer } from '../action-reducer.js';
import { ExpectedReducerError, ReducerError } from '../reducer-error.js';
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
    /**
     * If set, the templates of the removed category are moved into this category instead of being deleted.
     */
    moveTemplatesTo: measureTemplateCategorySchema.shape.name.optional(),
});
export type RemoveMeasureTemplateCategoryAction = z.infer<
    typeof removeMeasureTemplateCategoryActionSchema
>;

export namespace MeasureTemplateCategoryActionReducers {
    export const addMeasureTemplateCategory: ActionReducer<AddMeasureTemplateCategoryAction> =
        {
            type: addMeasureTemplateCategoryActionSchema.shape.type.value,
            actionSchema: addMeasureTemplateCategoryActionSchema,
            reducer: (draftState, { name }) => {
                if (draftState.measureTemplates[name] !== undefined) {
                    throw new ReducerError(
                        `MeasureTemplateCategory with name ${name} already exist`
                    );
                }
                draftState.measureTemplates[name] = castDraft(
                    newMeasureTemplateCategory(name, [])
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

                const category = getCategory(draftState, previousName);
                if (draftState.measureTemplates[newName] !== undefined) {
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
    export const removeMeasureTemplateCategory: ActionReducer<RemoveMeasureTemplateCategoryAction> =
        {
            type: removeMeasureTemplateCategoryActionSchema.shape.type.value,
            actionSchema: removeMeasureTemplateCategoryActionSchema,
            reducer: (draftState, { name, moveTemplatesTo }) => {
                const category = getCategory(draftState, name);
                if (moveTemplatesTo !== undefined) {
                    if (moveTemplatesTo === name) {
                        throw new ReducerError(
                            `Cannot move the templates of MeasureTemplateCategory ${name} into itself`
                        );
                    }
                    const targetCategory = getCategory(
                        draftState,
                        moveTemplatesTo
                    );
                    targetCategory.templates = {
                        ...category.templates,
                        ...targetCategory.templates,
                    };
                }
                delete draftState.measureTemplates[name];
                return draftState;
            },
            rights: 'trainer',
        };
}
