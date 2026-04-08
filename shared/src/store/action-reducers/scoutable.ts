import { IsBoolean, IsUUID } from 'class-validator';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';

import {
    type Scoutable,
    scoutableSchema,
    type ScoutableElement,
    scoutableElementSchema,
} from '../../models/scoutable.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {
    type UserGeneratedContent,
    userGeneratedContentSchema,
} from '../../models/user-generated-content.js';
import { type UUID, uuidValidationOptions } from '../../utils/uuid.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { getElement } from './utils/get-element.js';

export class MakeElementScoutableAction implements Action {
    @IsValue('[Scoutable] Make scoutable' as const)
    public readonly type = '[Scoutable] Make scoutable';

    @IsZodSchema(scoutableElementSchema)
    public readonly element!: ScoutableElement;

    @IsZodSchema(scoutableSchema)
    public readonly scoutable!: Scoutable;

    @IsZodSchema(userGeneratedContentSchema)
    public readonly content!: UserGeneratedContent;
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
            reducer: (draftState, { element, scoutable, content }) => {
                const stateElement = getElement(
                    draftState,
                    element.type,
                    element.id
                );
                stateElement.scoutableId = scoutable.id;
                draftState.userGeneratedContents[content.id] =
                    cloneDeepMutable(content);
                draftState.scoutables[scoutable.id] =
                    cloneDeepMutable(scoutable);

                const stateScoutable = getElement(
                    draftState,
                    'scoutable',
                    scoutable.id
                );
                stateScoutable.userGeneratedContentId = content.id;
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
}
