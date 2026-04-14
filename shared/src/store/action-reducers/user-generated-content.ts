import { IsString, IsUUID, MaxLength } from 'class-validator';
import { uuidValidationOptions, type UUID } from '../../utils/uuid.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';
import { getElement } from './utils/get-element.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {
    type UserGeneratedContent,
    userGeneratedContentSchema,
} from '../../models/user-generated-content.js';

export class AddContentAction implements Action {
    @IsValue('[UserGeneratedContent] Add content' as const)
    public readonly type = '[UserGeneratedContent] Add content';

    @IsZodSchema(userGeneratedContentSchema)
    public readonly content!: UserGeneratedContent;
}
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
    export const addContent: ActionReducer<AddContentAction> = {
        action: AddContentAction,
        reducer: (draftState, { content }) => {
            draftState.userGeneratedContents[content.id] = content;
            return draftState;
        },
        rights: 'trainer',
    };
    export const updateContent: ActionReducer<UpdateContentAction> = {
        action: UpdateContentAction,
        reducer: (draftState, { contentId, newContentString }) => {
            const element = getElement(
                draftState,
                'userGeneratedContent',
                contentId
            );
            element.content = newContentString;
            return draftState;
        },
        rights: 'trainer',
    };
}
