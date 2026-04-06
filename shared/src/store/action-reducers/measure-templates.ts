import { IsUUID } from 'class-validator';
import { z } from 'zod';
import { WritableDraft } from 'immer';
import {
    type MeasureProperty,
    type MeasureTemplate,
    measurePropertySchema,
    measureTemplateSchema,
} from '../../models/index.js';
import type { ExerciseState } from '../../state.js';
import { uuidSchema, type UUID } from '../../utils/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { uuidValidationOptions, cloneDeepMutable } from '../../utils/index.js';

export class AddMeasureTemplateAction implements Action {
    @IsValue('[MeasureTemplate] Add measureTemplate')
    public readonly type = '[MeasureTemplate] Add measureTemplate';

    @IsZodSchema(measureTemplateSchema)
    public readonly measureTemplate!: MeasureTemplate;
}

export class EditMeasureTemplateAction implements Action {
    @IsValue('[MeasureTemplate] Edit measureTemplate')
    public readonly type = '[MeasureTemplate] Edit measureTemplate';

    @IsZodSchema(uuidSchema)
    public readonly id!: UUID;

    @IsZodSchema(z.string().min(1))
    public readonly name!: string;

    @IsZodSchema(z.array(measurePropertySchema))
    public readonly properties!: readonly MeasureProperty[];
}

export class DeleteMeasureTemplateAction implements Action {
    @IsValue('[MeasureTemplate] Delete measureTemplate')
    public readonly type = '[MeasureTemplate] Delete measureTemplate';

    @IsUUID(4, uuidValidationOptions)
    public readonly id!: UUID;
}

export namespace MeasureTemplateActionReducers {
    export const addMeasureTemplate: ActionReducer<AddMeasureTemplateAction> = {
        action: AddMeasureTemplateAction,
        reducer: (draftState, { measureTemplate }) => {
            if (draftState.measureTemplates[measureTemplate.id]) {
                throw new ReducerError(
                    `MeasureTemplate with id ${measureTemplate.id} already exists`
                );
            }
            draftState.measureTemplates[measureTemplate.id] =
                cloneDeepMutable(measureTemplate);
            return draftState;
        },
        rights: 'trainer',
    };

    export const editMeasureTemplate: ActionReducer<EditMeasureTemplateAction> =
        {
            action: EditMeasureTemplateAction,
            reducer: (draftState, { id, name, properties }) => {
                const measureTemplate = getMeasureTemplate(draftState, id);
                measureTemplate.name = name;
                measureTemplate.properties = cloneDeepMutable(properties);
                return draftState;
            },
            rights: 'trainer',
        };

    export const deleteMeasureTemplate: ActionReducer<DeleteMeasureTemplateAction> =
        {
            action: DeleteMeasureTemplateAction,
            reducer: (draftState, { id }) => {
                getMeasureTemplate(draftState, id);
                delete draftState.measureTemplates[id];
                return draftState;
            },
            rights: 'trainer',
        };
}

function getMeasureTemplate(
    state: WritableDraft<ExerciseState>,
    id: UUID
): WritableDraft<MeasureTemplate> {
    const measureTemplate = state.measureTemplates[id];
    if (!measureTemplate) {
        throw new ReducerError(`MeasureTemplate with id ${id} does not exist`);
    }
    return measureTemplate;
}
