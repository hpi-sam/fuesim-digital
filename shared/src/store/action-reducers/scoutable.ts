import { IsBoolean, IsDefined, IsUUID } from 'class-validator';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';

import {
    type Scoutable,
    scoutableSchema,
    type ScoutableElement,
} from '../../models/scoutable.js';
import {
    cloneDeepMutable,
    getElement,
    ReducerError,
    type UUID,
    uuidValidationOptions,
} from '../../index.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { elementTypePluralMap } from '../../utils/element-type-plural-map.js';

export class MakeElementScoutableAction implements Action {
    @IsValue('[Scoutable] Make scoutable' as const)
    public readonly type = '[Scoutable] Make scoutable';

    @IsDefined()
    public readonly element!: ScoutableElement;

    @IsZodSchema(scoutableSchema)
    public readonly scoutable!: Scoutable;
}
export class SetisPaticipantVisible implements Action {
    @IsValue('[Scoutable] Set isPaticipantVisible' as const)
    public readonly type = '[Scoutable] Set isPaticipantVisible';

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
                ]!.scoutableId = scoutable.id;
                return draftState;
            },
            rights: 'trainer',
        };
    export const setisPaticipantVisible: ActionReducer<SetisPaticipantVisible> =
        {
            action: SetisPaticipantVisible,
            reducer: (draftState, { scoutableId, value }) => {
                const scoutable = getElement(
                    draftState,
                    'scoutable',
                    scoutableId
                );
                scoutable.isPaticipantVisible = value;
                return draftState;
            },
            rights: 'trainer',
        };
}
