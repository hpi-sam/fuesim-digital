import {
    type MeasureTemplate,
    measureTemplateCategorySchema,
    measureTemplateSchema,
} from '../../models/measure/measures.js';
import type { MeasureProperty } from '../../models/measure/properties.js';
import { uuidSchema, type UUID } from '../../utils/uuid.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import {
    getCategory,
    getCategoryForMeasureTemplateId,
    getMeasureTemplate,
} from './utils/measures.js';

export class AddMeasureTemplateAction implements Action {
    @IsValue('[MeasureTemplate] Add measureTemplate')
    public readonly type = '[MeasureTemplate] Add measureTemplate';

    @IsZodSchema(measureTemplateSchema)
    public readonly measureTemplate!: MeasureTemplate;

    @IsZodSchema(measureTemplateCategorySchema.shape.name)
    public readonly categoryName!: string;
}

export class EditMeasureTemplateAction implements Action {
    @IsValue('[MeasureTemplate] Edit measureTemplate')
    public readonly type = '[MeasureTemplate] Edit measureTemplate';

    @IsZodSchema(uuidSchema)
    public readonly id!: UUID;

    @IsZodSchema(measureTemplateSchema.shape.name)
    public readonly name!: string;

    @IsZodSchema(measureTemplateSchema.shape.properties)
    public readonly properties!: readonly MeasureProperty[];

    @IsZodSchema(measureTemplateSchema.shape.replacePrevious)
    public readonly replacePrevious!: boolean;
}

export class MoveMeasureTemplateAction implements Action {
    @IsValue('[MeasureTemplate] Move measureTemplate')
    public readonly type = '[MeasureTemplate] Move measureTemplate';

    @IsZodSchema(uuidSchema)
    public readonly id!: UUID;

    @IsZodSchema(measureTemplateCategorySchema.shape.name)
    public readonly categoryName!: string;
}

export class DeleteMeasureTemplateAction implements Action {
    @IsValue('[MeasureTemplate] Delete measureTemplate')
    public readonly type = '[MeasureTemplate] Delete measureTemplate';

    @IsZodSchema(uuidSchema)
    public readonly id!: UUID;
}

export namespace MeasureTemplateActionReducers {
    export const addMeasureTemplate: ActionReducer<AddMeasureTemplateAction> = {
        action: AddMeasureTemplateAction,
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
            action: EditMeasureTemplateAction,
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
            action: MoveMeasureTemplateAction,
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

    export const deleteMeasureTemplate: ActionReducer<DeleteMeasureTemplateAction> =
        {
            action: DeleteMeasureTemplateAction,
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
