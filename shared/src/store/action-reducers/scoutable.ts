import { IsUUID } from 'class-validator';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';
import { IsLiteralUnion } from '../../utils/validators/is-literal-union.js';
import { type UUID, uuidValidationOptions } from '../../utils/uuid.js';
import {
    type Scoutable,
    scoutableSchema,
    type ScoutableElementType,
} from '../../models/scoutable.js';
import { cloneDeepMutable, getElement } from '../../index.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';

export class MakeElementScoutableAction implements Action {
    @IsValue('[Scoutable] Make scoutable' as const)
    public readonly type = '[Scoutable] Make scoutable';

    @IsLiteralUnion({
        patient: true,
        vehicle: true,
    })
    public readonly elementType!: ScoutableElementType;

    @IsUUID(4, uuidValidationOptions)
    public readonly elementId!: UUID;

    @IsZodSchema(scoutableSchema)
    public readonly scoutable!: Scoutable;
}

export namespace ScoutableActionReducers {
    export const makeElementScoutable: ActionReducer<MakeElementScoutableAction> =
        {
            action: MakeElementScoutableAction,
            reducer: (draftState, { elementType, elementId, scoutable }) => {
                draftState.scoutables[scoutable.id] =
                    cloneDeepMutable(scoutable);
                const element = getElement(draftState, elementType, elementId);
                element.scoutableId = scoutable.id;
                return draftState;
            },
            rights: 'trainer',
        };
}
