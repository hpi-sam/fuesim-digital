import { IsBoolean, IsUUID } from 'class-validator';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';

import {
    type Scoutable,
    scoutableSchema,
    scoutableElementTypeSchema,
    type ScoutableElementType,
} from '../../models/scoutable.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {
    type UserGeneratedContent,
    userGeneratedContentSchema,
} from '../../models/user-generated-content.js';
import {
    uuidSchema,
    type UUID,
    uuidValidationOptions,
} from '../../utils/uuid.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { getElement } from './utils/get-element.js';

export class MakeElementScoutableAction implements Action {
    @IsValue('[Scoutable] Make scoutable' as const)
    public readonly type = '[Scoutable] Make scoutable';

    @IsZodSchema(scoutableElementTypeSchema)
    public readonly elementType!: ScoutableElementType;

    @IsZodSchema(uuidSchema)
    public readonly elementId!: UUID;

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

export class UpdateScoutableContentAction implements Action {
    @IsValue('[Scoutable] Update content')
    public readonly type = '[Scoutable] Update content';

    @IsUUID(4, uuidValidationOptions)
    public readonly scoutableId!: UUID;

    @IsZodSchema(userGeneratedContentSchema)
    public readonly userGeneratedContent!: UserGeneratedContent;
}

export namespace ScoutableActionReducers {
    export const makeElementScoutable: ActionReducer<MakeElementScoutableAction> =
        {
            action: MakeElementScoutableAction,
            reducer: (draftState, { elementType, elementId, scoutable }) => {
                const element = getElement(draftState, elementType, elementId);
                element.scoutableId = scoutable.id;
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
        action: UpdateScoutableContentAction,
        reducer: (draftState, { scoutableId, userGeneratedContent }) => {
            const element = getElement(draftState, 'scoutable', scoutableId);
            element.userGeneratedContent = userGeneratedContent;
            return draftState;
        },
        rights: 'trainer',
    };
}
