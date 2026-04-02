import { IsBoolean, IsUUID } from 'class-validator';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';

import {
    type Scoutable,
    scoutableSchema,
    type ScoutableElement,
    scoutableElementSchema,
} from '../../models/scoutable.js';
import {
    cloneDeepMutable,
    getElement,
    ReducerError,
    type UserGeneratedContent,
    userGeneratedContentSchema,
    type UUID,
    uuidValidationOptions,
} from '../../index.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { elementTypePluralMap } from '../../utils/element-type-plural-map.js';

export class MakeElementScoutableAction implements Action {
    @IsValue('[Scoutable] Make scoutable' as const)
    public readonly type = '[Scoutable] Make scoutable';

    @IsZodSchema(scoutableElementSchema)
    public readonly element_input!: ScoutableElement;

    @IsZodSchema(scoutableSchema)
    public readonly scoutable_input!: Scoutable;

    @IsZodSchema(userGeneratedContentSchema)
    public readonly content!: UserGeneratedContent;
}
export class SetisVisibleForParticipants implements Action {
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
            reducer: (
                draftState,
                { element_input, scoutable_input, content }
            ) => {
                const element = getElement(
                    draftState,
                    element_input.type,
                    element_input.id
                );
                element.scoutableId = scoutable_input.id;
                draftState.userGeneratedContents[content.id] =
                    cloneDeepMutable(content);
                draftState.scoutables[scoutable_input.id] =
                    cloneDeepMutable(scoutable_input);

                const scoutable = getElement(
                    draftState,
                    'scoutable',
                    scoutable_input.id
                );
                scoutable.userGeneratedContentId = content.id;

                /* TODO @JohannesPotzi : remove commentated section */
                /* const scout = cloneDeepMutable(scoutable);
                scout.userGeneratedContentId = content.id;
                draftState.userGeneratedContents[content.id] =
                    cloneDeepMutable(content);
                draftState.scoutables[scoutable.id] = cloneDeepMutable(scout); */

                /*
                draftState.scoutables[scoutable.id] =
                    cloneDeepMutable(scoutable);
                if (
                    !draftState[elementTypePluralMap[element.type]][element.id]
                ) {
                    throw new ReducerError(
                        'dieses element steht nicht im state'
                    );
                }
                draftState[elementTypePluralMap[element.type]][
                    element.id
                ]!.scoutableId = scoutable.id; */
                return draftState;
            },
            rights: 'trainer',
        };
    export const setisVisibleForParticipants: ActionReducer<SetisVisibleForParticipants> =
        {
            action: SetisVisibleForParticipants,
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
