import { IsBoolean, IsUUID } from 'class-validator';
import { z } from 'zod';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';

import {
    type Scoutable,
    scoutableSchema,
    type ScoutableElement,
    scoutableElementSchema,
} from '../../models/scoutable.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { userGeneratedContentSchema } from '../../models/user-generated-content.js';
import { type UUID, uuidValidationOptions } from '../../utils/uuid.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { getElement } from './utils/get-element.js';

const updateScoutableContentActionSchema = z.strictObject({
    type: z.literal('[Scoutable] Update content'),
    scoutableId: scoutableSchema.shape.id,
    userGeneratedContent: userGeneratedContentSchema,
});
export type UpdateScoutableContentAction = z.infer<
    typeof updateScoutableContentActionSchema
>;

// TODO migrate to zod actions
export class MakeElementScoutableAction implements Action {
    @IsValue('[Scoutable] Make scoutable' as const)
    public readonly type = '[Scoutable] Make scoutable';

    @IsZodSchema(scoutableElementSchema)
    public readonly element!: ScoutableElement;

    @IsZodSchema(scoutableSchema)
    public readonly scoutable!: Scoutable;
}
export class SetIsVisibleForParticipants implements Action {
    @IsValue('[Scoutable] Set isVisibleForParticipants' as const)
    public readonly type = '[Scoutable] Set isVisibleForParticipants';

    @IsUUID(4, uuidValidationOptions)
    public readonly scoutableId!: UUID;

    @IsBoolean()
    public readonly value!: boolean;
}

export namespace ScoutableActionReducers {
    export const makeElementScoutable: ActionReducer<MakeElementScoutableAction> =
        {
            action: MakeElementScoutableAction,
            reducer: (draftState, { element, scoutable }) => {
                const stateElement = getElement(
                    draftState,
                    element.type,
                    element.id
                );
                stateElement.scoutableId = scoutable.id;
                draftState.scoutables[scoutable.id] =
                    cloneDeepMutable(scoutable);

                return draftState;
            },
            rights: 'trainer',
        };
    export const setIsVisibleForParticipants: ActionReducer<SetIsVisibleForParticipants> =
        {
            action: SetIsVisibleForParticipants,
            reducer: (draftState, { scoutableId, value }) => {
                const scoutable = getElement(
                    draftState,
                    'scoutable',
                    scoutableId
                );
                scoutable.isVisibleForParticipants = value;
                return draftState;
            },
            rights: 'trainer',
        };
    export const updateContent: ActionReducer<UpdateScoutableContentAction> = {
        type: updateScoutableContentActionSchema.shape.type.value,
        actionSchema: updateScoutableContentActionSchema,
        reducer: (draftState, { scoutableId, userGeneratedContent }) => {
            const element = getElement(draftState, 'scoutable', scoutableId);

            element.userGeneratedContent = userGeneratedContent;

            return draftState;
        },
        rights: 'trainer',
    };
}
