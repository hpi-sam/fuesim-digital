import {  IsUUID } from 'class-validator';
import { WritableDraft } from 'immer';
import {
    type MeasureTemplate,
    measureTemplateSchema,
} from '../../models/index.js';
import type { ExerciseState } from '../../state.js';
import type { UUID } from '../../utils/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {

    uuidValidationOptions,
    cloneDeepMutable,
} from '../../utils/index.js';

export class AddMeasureTemplateAction implements Action {
    @IsValue('[MeasureTemplate] Add measureTemplate')
    public readonly type = '[MeasureTemplate] Add measureTemplate';

    @IsZodSchema(measureTemplateSchema)
    public readonly measureTemplate!: MeasureTemplate;
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
