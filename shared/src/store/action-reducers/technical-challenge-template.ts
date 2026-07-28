import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { technicalChallengeTemplateSchema } from '../../models/technical-challenge/technical-challenge-template.js';

const updateTechnicalChallengeTemplateActionSchema = z.strictObject({
    type: z.literal('[TechnicalChallengeTemplate] Update template'),
    updatedTechnicalChallengeTemplate: technicalChallengeTemplateSchema,
});

export namespace TechnicalChallengeTemplateActionReducers {
    export const updateTechnicalChallengeTemplateAction: ActionReducer<
        Immutable<z.infer<typeof updateTechnicalChallengeTemplateActionSchema>>
    > = {
        type: updateTechnicalChallengeTemplateActionSchema.shape.type.value,
        actionSchema: updateTechnicalChallengeTemplateActionSchema,
        reducer: (draftState, action) => {
            const technicalChallengeTemplate =
                draftState.technicalChallengeTemplates[
                    action.updatedTechnicalChallengeTemplate.id
                ];
            if (!technicalChallengeTemplate) {
                throw new ReducerError(
                    `TechnicalChallengeTemplate with id ${action.updatedTechnicalChallengeTemplate.id} does not exist.`
                );
            }

            draftState.technicalChallengeTemplates[
                technicalChallengeTemplate.id
            ] = cloneDeepMutable(action.updatedTechnicalChallengeTemplate);
            return draftState;
        },
        rights: 'trainer',
    };
}
