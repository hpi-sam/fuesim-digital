import { z } from 'zod';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { uuidSchema } from '../../utils/uuid.js';
import type { ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { evalCriterionSchema } from '../../models/eval-criteria/criterion-categories.js';
import { getElement } from './utils/get-element.js';
import { Immutable } from 'immer';

const createNewCriterionsActionSchema = z.strictObject({
    type: z.literal('[EvalCriterion] New Criteria'),
    criteria: z.array(evalCriterionSchema).min(1),
});
export type NewCriterionAction = Immutable<
    z.infer<typeof createNewCriterionsActionSchema>
>;
const updateCriterionActionSchema = z.strictObject({
    type: z.literal('[EvalCriterion] Update Criterion'),
    id: uuidSchema,
    newCriterion: evalCriterionSchema,
});
export type UpdateCriterionAction = Immutable<
    z.infer<typeof updateCriterionActionSchema>
>;
export namespace EvalCriterionActionReducers {
    export const createNewCriteria: ActionReducer<NewCriterionAction> = {
        type: createNewCriterionsActionSchema.shape.type.value,
        actionSchema: createNewCriterionsActionSchema,
        reducer: (draftState, { criteria }) => {
            for (const criterion of criteria) {
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
}
