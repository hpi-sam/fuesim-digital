import { measureSchema, type Measure } from '../../models/measure/measures.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import type { Action, ActionReducer } from '../action-reducer.js';

export class AddMeasureAction implements Action {
    @IsValue('[Measure] Add Measure' as const)
    public readonly type = '[Measure] Add Measure';

    @IsZodSchema(measureSchema)
    public readonly measure!: Measure;
}

export namespace MeasureActionReducers {
    export const addMeasure: ActionReducer<AddMeasureAction> = {
        action: AddMeasureAction,
        reducer: (draftState, { measure }) => {
            draftState.measures[measure.id] = measure;
            return draftState;
        },
        rights: 'participant',
    };
}
