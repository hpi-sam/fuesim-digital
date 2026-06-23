import { z } from 'zod';
import type { ActionReducer } from '../action-reducer.js';
import {
    evalCriterionIdSchema,
    evalCriterionSchema,
} from '../../models/eval-criterion.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { ReducerError } from '../reducer-error.js';
import { getElement } from './utils/get-element.js';

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
    id: evalCriterionIdSchema,
    newCriterion: evalCriterionSchema,
});
export type UpdateCriterionAction = z.infer<typeof updateCriterionActionSchema>;

/* TODO @JohannesPotzi @Jogius : drop this, below as well */
/* const updateResultActionSchema = z.strictObject({
    type: z.literal('[EvalCriterion] Update Result'),
    criterionId: uuidSchema,
    newResult: evalResultSchema,
});
export type UpdateResultAction = z.infer<typeof updateResultActionSchema>; */
export namespace EvalCriterionActionReducers {
    export const createNewCriterions: ActionReducer<NewCriterionAction> = {
        type: createNewCriterionsActionSchema.shape.type.value,
        actionSchema: createNewCriterionsActionSchema,
        reducer: (draftState, { criterions }) => {
            for (const criterion of criterions) {
                const criterionClone = cloneDeepMutable(criterion);
                draftState.evalCriteria[criterion.id] = criterionClone;
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
    /* export const updateResult: ActionReducer<UpdateResultAction> = {
        type: updateResultActionSchema.shape.type.value,
        actionSchema: updateResultActionSchema,
        reducer: (draftState, { criterionId, newResult }) => {
            const criterion = getElement(
                draftState,
                'evalCriterion',
                criterionId
            );
            const resultType = newResult.type;
            if (isNumberEvalCriterion(criterion)) {
                const typedCriterion = criterion as NumberEvalCriterion;
                if (resultType !== 'numberEvalResult') {
                    throw new ReducerError(
                        '[logic Error] trying to assign a non number evalResult to a NumberEvalCriterion.'
                    );
                } else {
                    typedCriterion.results.push(newResult);
                    draftState.evalCriteria[criterionId] = typedCriterion;
                }
            } else {
                const typedCriterion = criterion as BoolEvalCriterion;
                if (resultType !== 'boolEvalResult') {
                    throw new ReducerError(
                        '[logic Error] trying to assign a non boolean evalResult to a BoolEvalCriterion.'
                    );
                } else {
                    typedCriterion.results.push(newResult);
                    draftState.evalCriteria[criterionId] = typedCriterion;
                }
            }
            return draftState;
        },
        rights: 'participant',
    }; */
}
