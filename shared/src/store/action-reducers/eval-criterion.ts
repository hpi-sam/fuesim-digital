import z from 'zod';
import { ActionReducer } from '../action-reducer.js';
import { evalCriterionSchema } from '../../models/evaluation-criterion.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { uuidSchema } from '../../utils/uuid.js';
import { getElement } from './utils/get-element.js';
import { ReducerError } from '../reducer-error.js';

/* The EvalCriteria at criterionType are:
doMeasureXTimesEvalCriterion
reachTechnicalChallengeStateEvalCriterion
patientAtStatusEvalCriterion
xPatientsAtStatusEvalCriterion
viewScoutableEvalCriterion
*/
const newCriterionActionSchema = z.strictObject({
    type: z.literal('[EvalCriterion] New Criterion'),
    criterion: evalCriterionSchema,
});
export type NewCriterionAction = z.infer<typeof newCriterionActionSchema>;
const updateCriterionActionSchema = z.strictObject({
    type: z.literal('[EvalCriterion] Update Criterion'),
    id: uuidSchema,
    newCriterion: evalCriterionSchema,
});
export type UpdateCriterionAction = z.infer<typeof updateCriterionActionSchema>;

export namespace EvalCriterionActionReducers {
    export const newCriterion: ActionReducer<NewCriterionAction> = {
        type: newCriterionActionSchema.shape.type.value,
        actionSchema: newCriterionActionSchema,
        reducer: (draftState, { criterion }) => {
            draftState.evalCriteria[criterion.id] = cloneDeepMutable(criterion);
            return draftState;
        },
        rights: 'trainer',
    };
    export const updateCriterion: ActionReducer<UpdateCriterionAction> = {
        type: updateCriterionActionSchema.shape.type.value,
        actionSchema: updateCriterionActionSchema,
        reducer: (draftState, { id, newCriterion }) => {
            const criterion = getElement(draftState, 'evalCriterion', id);
            if (criterion.criterionType !== newCriterion.criterionType) {
                throw new ReducerError(
                    'Can not update EvalCriterion. The Input Criterion has a different criterionType.'
                );
            }
            let newCriterionMutable = cloneDeepMutable(newCriterion);
            newCriterionMutable.id = id;
            draftState.evalCriteria[id] = newCriterionMutable;
            return draftState;
        },
        rights: 'trainer',
    };
}
