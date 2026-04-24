import { z } from 'zod';
import {
    measureTemplateCategorySchema,
    measureTemplateSchema,
} from '../../models/measure/measures.js';
import type { ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import {
    getCategory,
    getCategoryForMeasureTemplateId,
    getMeasureTemplate,
} from './utils/measures.js';

export const addMeasureTemplateActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplate] Add MeasureTemplate'),
    measureTemplate: measureTemplateSchema,
    categoryName: measureTemplateCategorySchema.shape.name,
});
export type AddMeasureTemplateAction = z.infer<
    typeof addMeasureTemplateActionSchema
>;

export const editMeasureTemplateActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplate] Edit MeasureTemplate'),
    id: measureTemplateSchema.shape.id,
    name: measureTemplateSchema.shape.name,
    properties: measureTemplateSchema.shape.properties,
    replacePrevious: measureTemplateSchema.shape.replacePrevious,
});
export type EditMeasureTemplateAction = z.infer<
    typeof editMeasureTemplateActionSchema
>;

export const moveMeasureTemplateActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplate] Move MeasureTemplate'),
    id: measureTemplateSchema.shape.id,
    categoryName: measureTemplateCategorySchema.shape.name,
});
export type MoveMeasureTemplateAction = z.infer<
    typeof moveMeasureTemplateActionSchema
>;

export const removeMeasureTemplateActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplate] Remove MeasureTemplate'),
    id: measureTemplateSchema.shape.id,
});
export type RemoveMeasureTemplateAction = z.infer<
    typeof removeMeasureTemplateActionSchema
>;
export namespace MeasureTemplateActionReducers {
    export const addMeasureTemplate: ActionReducer<AddMeasureTemplateAction> = {
        type: '[MeasureTemplate] Add MeasureTemplate',
        actionSchema: addMeasureTemplateActionSchema,
        reducer: (draftState, { measureTemplate, categoryName }) => {
            const category = getCategory(draftState, categoryName);
            if (
                Object.values(draftState.measureTemplates).some((c) =>
                    Object.values(c.templates).some(
                        (t) => t.id === measureTemplate.id
                    )
                )
            ) {
                throw new ReducerError(
                    `MeasureTemplate with id ${measureTemplate.id} already exists`
                );
            }

            category.templates[measureTemplate.id] =
                cloneDeepMutable(measureTemplate);
            return draftState;
        },
        rights: 'trainer',
    };

    export const editMeasureTemplate: ActionReducer<EditMeasureTemplateAction> =
        {
            type: '[MeasureTemplate] Edit MeasureTemplate',
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

    export const moveMeasureTemplate: ActionReducer<MoveMeasureTemplateAction> =
        {
            type: '[MeasureTemplate] Move MeasureTemplate',
            actionSchema: moveMeasureTemplateActionSchema,
            reducer: (draftState, { id, categoryName: category }) => {
                const previousCategory = getCategoryForMeasureTemplateId(
                    draftState,
                    id
                );
                const measure = getMeasureTemplate(
                    draftState,
                    id,
                    previousCategory
                );

                const nextCategory = getCategory(draftState, category);
                delete previousCategory.templates[id];

                nextCategory.templates[id] = measure;
                return draftState;
            },
            rights: 'trainer',
        };

    export const removeMeasureTemplate: ActionReducer<RemoveMeasureTemplateAction> =
        {
            type: '[MeasureTemplate] Remove MeasureTemplate',
            actionSchema: removeMeasureTemplateActionSchema,
            reducer: (draftState, { id }) => {
                const category = getCategoryForMeasureTemplateId(
                    draftState,
                    id
                );
                delete category.templates[id];
                return draftState;
            },
            rights: 'trainer',
        };
}
