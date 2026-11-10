import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { technicalChallengeTemplateSchema } from '../../models/technical-challenge/technical-challenge-template.js';

const importTechnicalChallengeTemplateActionSchema = z.strictObject({
    type: z.literal('[TechnicalChallengeTemplate] Import a new template'),
    technicalChallengeTemplate: technicalChallengeTemplateSchema,
    // TODO@Felix: How to handle nonexisting qualifications?
});

const updateTechnicalChallengeTemplateActionSchema = z.strictObject({
    type: z.literal('[TechnicalChallengeTemplate] Update template'),
    updatedTechnicalChallengeTemplate: technicalChallengeTemplateSchema,
});

export namespace TechnicalChallengeTemplateActionReducers {
    export const importTechnicalChallengeTemplateAction: ActionReducer<
        Immutable<z.infer<typeof importTechnicalChallengeTemplateActionSchema>>
    > = {
        type: importTechnicalChallengeTemplateActionSchema.shape.type.value,
        actionSchema: importTechnicalChallengeTemplateActionSchema,
        reducer: (draftState, { technicalChallengeTemplate }) => {
            draftState.templates[technicalChallengeTemplate.id] =
                cloneDeepMutable(technicalChallengeTemplate);

            return draftState;
        },
        rights: 'trainer',
    };
    export const updateTechnicalChallengeTemplateAction: ActionReducer<
        Immutable<z.infer<typeof updateTechnicalChallengeTemplateActionSchema>>
    > = {
        type: updateTechnicalChallengeTemplateActionSchema.shape.type.value,
        actionSchema: updateTechnicalChallengeTemplateActionSchema,
        reducer: (draftState, action) => {
            const technicalChallengeTemplate =
                draftState.templates[
                    action.updatedTechnicalChallengeTemplate.id
                ];
            if (!technicalChallengeTemplate) {
                throw new ReducerError(
                    `TechnicalChallengeTemplate with id ${action.updatedTechnicalChallengeTemplate.id} does not exist.`
                );
            }

            draftState.templates[technicalChallengeTemplate.id] =
                cloneDeepMutable(action.updatedTechnicalChallengeTemplate);
            return draftState;
        },
        rights: 'trainer',
    };
}
