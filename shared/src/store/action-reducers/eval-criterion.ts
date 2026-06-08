import { z } from 'zod';
import type { ActionReducer } from '../action-reducer.js';
import {
    EvalCriterion,
    evalCriterionSchema,
} from '../../models/evaluation-criterion.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { uuidSchema } from '../../utils/uuid.js';
import { ReducerError } from '../reducer-error.js';
import { getElement } from './utils/get-element.js';
import { evalResultSchema } from '../../utils/eval-results.js';

/* The EvalCriteria at criterionType are:
doMeasureXTimesEvalCriterion
reachTechnicalChallengeStateEvalCriterion
patientAtStatusEvalCriterion
xPatientsAtStatusEvalCriterion
viewScoutableEvalCriterion
*/
const createNewCriterionsActionSchema = z.strictObject({
    type: z.literal('[EvalCriterion] New Criterions'),
    criterions: z.array(evalCriterionSchema).min(1),
});
export type NewCriterionAction = z.infer<
    typeof createNewCriterionsActionSchema
>;
const updateCriterionActionSchema = z.strictObject({
    type: z.literal('[EvalCriterion] Update Criterion'),
    id: uuidSchema,
    newCriterion: evalCriterionSchema,
});
export type UpdateCriterionAction = z.infer<typeof updateCriterionActionSchema>;

const updateResultActionSchema = z.strictObject({
    type: z.literal('[EvalCriterion] Update Result'),
    criterionId: uuidSchema,
    newResult: evalResultSchema,
});
export type UpdateResultAction = z.infer<typeof updateResultActionSchema>;
export namespace EvalCriterionActionReducers {
    export const createNewCriterions: ActionReducer<NewCriterionAction> = {
        type: createNewCriterionsActionSchema.shape.type.value,
        actionSchema: createNewCriterionsActionSchema,
        reducer: (draftState, { criterions }) => {
            for (let i = 0; i < criterions.length; i += 1) {
                const criterion = cloneDeepMutable(criterions[i]!);
                draftState.evalCriteria[criterion.id] = criterion;
            }
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
            const newCriterionMutable = cloneDeepMutable(newCriterion);
            newCriterionMutable.id = id;
            draftState.evalCriteria[id] = newCriterionMutable;
            return draftState;
        },
        rights: 'trainer',
    };
    export const updateResult: ActionReducer<UpdateResultAction> = {
        type: updateResultActionSchema.shape.type.value,
        actionSchema: updateResultActionSchema,
        reducer: (draftState, {}) => {
            return draftState;
        },
        rights: 'participant',
    };
}
