import { IsDefined } from 'class-validator';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';

import {
    type Scoutable,
    scoutableSchema,
    type ScoutableElement,
} from '../../models/scoutable.js';
import { cloneDeepMutable } from '../../index.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { elementTypePluralMap } from '../../utils/element-type-plural-map.js';

export class MakeElementScoutableAction implements Action {
    @IsValue('[Scoutable] Make scoutable' as const)
    public readonly type = '[Scoutable] Make scoutable';

    @IsDefined()
    public readonly element!: ScoutableElement;
    /*
    @IsLiteralUnion({
        patient: true,
        vehicle: true,
    })
    public readonly elementType!: ScoutableElementType;

    @IsUUID(4, uuidValidationOptions)
    public readonly elementId!: UUID;
     */

    @IsZodSchema(scoutableSchema)
    public readonly scoutable!: Scoutable;
}

export namespace ScoutableActionReducers {
    export const makeElementScoutable: ActionReducer<MakeElementScoutableAction> =
        {
            action: MakeElementScoutableAction,
            reducer: (draftState, { element, scoutable }) => {
                draftState.scoutables[scoutable.id] =
                    cloneDeepMutable(scoutable);
                /* const element = getElement(draftState, elementType, elementId); */
                draftState[elementTypePluralMap[element.type]][
                    element.id
                ]!.scoutableId = scoutable.id;
                return draftState;
            },
            rights: 'trainer',
        };
}
