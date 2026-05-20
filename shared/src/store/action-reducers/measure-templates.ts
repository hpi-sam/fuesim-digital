import { z } from 'zod';
import type { Immutable } from 'immer';
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

export const changeCategoryOfMeasureTemplateActionSchema = z.strictObject({
    type: z.literal('[MeasureTemplate] Change Category of MeasureTemplate'),
    id: measureTemplateSchema.shape.id,
    categoryName: measureTemplateCategorySchema.shape.name,
});
export type ChangeCategoryOfMeasureTemplateAction = Immutable<
    z.infer<typeof changeCategoryOfMeasureTemplateActionSchema>
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
        type: '[MeasureTemplate] Add MeasureTemplate',
        actionSchema: addMeasureTemplateActionSchema,
        reducer: (draftState, { measureTemplate, categoryName }) => {
            const templateAlreadyExists = Object.values(
                draftState.measureTemplates
            ).some((c) => !!c.templates[measureTemplate.id]);
            if (templateAlreadyExists) {
                throw new ReducerError(
                    `MeasureTemplate with id ${measureTemplate.id} already exists`
                );
            }
            const category = getCategory(draftState, categoryName);
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

    export const changeCategoryOfMeasureTemplate: ActionReducer<ChangeCategoryOfMeasureTemplateAction> =
        {
            type: '[MeasureTemplate] Change Category of MeasureTemplate',
            actionSchema: changeCategoryOfMeasureTemplateActionSchema,
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
