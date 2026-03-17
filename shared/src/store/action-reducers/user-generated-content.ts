import { IsString, IsUUID, MaxLength } from 'class-validator';
import { uuidValidationOptions, type UUID } from '../../utils/uuid.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';
import {
    type UserGeneratedContent,
    userGeneratedContentSchema,
} from '../../models/user-generated-content.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { getElement } from './utils/get-element.js';

export class AssignNewContentToElementAction implements Action {
    @IsValue('[UserGeneratedContent] Assign new content to element' as const)
    public readonly type =
        '[UserGeneratedContent] Assign new content to element';

    @IsUUID(4, uuidValidationOptions)
    public readonly elementId!: UUID;

    @IsZodSchema(userGeneratedContentSchema)
    public readonly content!: UserGeneratedContent;
}
export class DeleteContentAction implements Action {
    @IsValue('[UserGeneratedContent] Delete content' as const)
    public readonly type = '[UserGeneratedContent] Delete content';

    @IsUUID(4, uuidValidationOptions)
    public readonly contentId!: UUID;
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
    export const assignNewContentToElement: ActionReducer<AssignNewContentToElementAction> =
        {
            action: AssignNewContentToElementAction,
            reducer: (draftState, { elementId, content }) => {
                draftState.userGeneratedContents[content.id] =
                    cloneDeepMutable(content);
                const element = getElement(draftState, 'scoutable', elementId);
                element.userGeneratedContentIds.push(content.id);
                return draftState;
            },
            rights: 'trainer',
        };
    export const deleteContent: ActionReducer<DeleteContentAction> = {
        action: DeleteContentAction,
        reducer: (draftState, { contentId }) => {
            getElement(draftState, 'userGeneratedContent', contentId);
            delete draftState['userGeneratedContents'][contentId];
            return draftState;
        },
        rights: 'trainer',
    };
    export const updateContent: ActionReducer<UpdateContentAction> = {
        action: UpdateContentAction,
        reducer: (draftState, { contentId, newContentString }) => {
            const oldContent = getElement(
                draftState,
                'userGeneratedContent',
                contentId
            );
            oldContent.content = newContentString;
            return draftState;
        },
        rights: 'trainer',
    };
}
