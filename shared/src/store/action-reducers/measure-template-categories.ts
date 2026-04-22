import { measureTemplateCategorySchema } from '../../models/measure/measures.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { getCategory } from './utils/measures.js';

export class AddMeasureTemplateCategoryAction implements Action {
    @IsValue('[MeasureTemplateCategory] Add measureTemplateCategory')
    public readonly type =
        '[MeasureTemplateCategory] Add measureTemplateCategory';

    @IsZodSchema(measureTemplateCategorySchema.shape.name)
    public readonly name!: string;
}

export class RenameMeasureTemplateCategoryAction implements Action {
    @IsValue('[MeasureTemplateCategory] Rename measureTemplateCategory')
    public readonly type =
        '[MeasureTemplateCategory] Rename measureTemplateCategory';

    @IsZodSchema(measureTemplateCategorySchema.shape.name)
    public readonly previousName!: string;

    @IsZodSchema(measureTemplateCategorySchema.shape.name)
    public readonly newName!: string;
}

export class DeleteMeasureTemplateCategoryAction implements Action {
    @IsValue('[MeasureTemplateCategory] Delete measureTemplateCategory')
    public readonly type =
        '[MeasureTemplateCategory] Delete measureTemplateCategory';

    @IsZodSchema(measureTemplateCategorySchema.shape.name)
    public readonly name!: string;
}

export namespace MeasureTemplateActionReducers {
    export const addMeasureTemplateCategory: ActionReducer<AddMeasureTemplateCategoryAction> =
        {
            action: AddMeasureTemplateCategoryAction,
            reducer: (draftState, { name }) => {
                if (draftState.measureTemplates[name] !== undefined) {
                    throw new ReducerError(
                        `MeasureTemplateCategory with name ${name} already exist`
                    );
                }
                draftState.measureTemplates[name] = { name, templates: {} };
                return draftState;
            },
            rights: 'trainer',
        };
    export const renameMeasureTemplateCategory: ActionReducer<RenameMeasureTemplateCategoryAction> =
        {
            action: RenameMeasureTemplateCategoryAction,
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
    export const deleteMeasureTemplateCategory: ActionReducer<DeleteMeasureTemplateCategoryAction> =
        {
            action: DeleteMeasureTemplateCategoryAction,
            reducer: (draftState, { name }) => {
                const category = getCategory(draftState, name);
                if (Object.entries(draftState.measureTemplates).length === 1) {
                    throw new ReducerError(
                        `Cannot delete the last MeasureTemplateCategory`
                    );
                }
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
