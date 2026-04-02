import { IsString, IsUUID, MaxLength } from 'class-validator';
import { uuidValidationOptions, type UUID } from '../../utils/uuid.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';
import { getElement } from './utils/get-element.js';
export class UpdateContentAction implements Action {
    @IsValue('[UserGeneratedContent] Update content' as const)
    public readonly type = '[UserGeneratedContent] Update content';

    @IsUUID(4, uuidValidationOptions)
    public readonly contentId!: UUID;

    @IsString()
    @MaxLength(65535)
    public readonly newContentString!: string;
}
export namespace UserGeneratedContentActionReducers {
    export const updateContent: ActionReducer<UpdateContentAction> = {
        action: UpdateContentAction,
        reducer: (draftState, { contentId, newContentString }) => {
            const element = getElement(
                draftState,
                'userGeneratedContent',
                contentId
            );
            element.content = newContentString;
            console.log('updated contemt: ' + element.content);
            return draftState;
        },
        rights: 'trainer',
    };
}
