import { IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {
    VersionedCollectionPartial,
    versionedCollectionPartialSchema,
} from '../../index.js';

export class SetExerciseCollection implements Action {
    @IsValue('[Collection] Set Exercise Collection' as const)
    public readonly type = '[Collection] Set Exercise Collection';

    @IsZodSchema(versionedCollectionPartialSchema.nullable())
    public readonly collectionVersion!: VersionedCollectionPartial | null;
}

export namespace CollectionReducers {
    export const setCollection: ActionReducer<SetExerciseCollection> = {
        action: SetExerciseCollection,
        reducer: (draftState, data) => {
            draftState.selectedCollection = data.collectionVersion;
            return draftState;
        },
        rights: 'trainer',
    };
}
