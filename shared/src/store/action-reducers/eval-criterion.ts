import { z } from 'zod';

import {
    ActionReducer,
    uuidSchema,
    evalCriterionSchema,
    cloneDeepMutable,
    ReducerError,
    getElement,
} from 'fuesim-digital-shared';

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
}
