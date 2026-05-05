import { z } from 'zod';
import type { ActionReducer } from '../action-reducer.js';

import {
    scoutableSchema,
    scoutableElementTypeSchema,
} from '../../models/scoutable.js';
import { userGeneratedContentSchema } from '../../models/user-generated-content.js';
import { uuidSchema } from '../../utils/uuid.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { getElement } from './utils/get-element.js';
import { logScoutableViewed } from './utils/log.js';

const updateScoutableContentActionSchema = z.strictObject({
    type: z.literal('[Scoutable] Update content'),
    scoutableId: scoutableSchema.shape.id,
    userGeneratedContent: userGeneratedContentSchema,
});
export type UpdateScoutableContentAction = z.infer<
    typeof updateScoutableContentActionSchema
>;

const makeElementScoutableActionSchema = z.strictObject({
    type: z.literal('[Scoutable] Make scoutable'),
    elementType: scoutableElementTypeSchema,
    elementId: uuidSchema,
    scoutable: scoutableSchema,
});
export type MakeElementScoutableAction = z.infer<
    typeof makeElementScoutableActionSchema
>;

const setIsVisibleForParticipantsActionSchema = z.strictObject({
    type: z.literal('[Scoutable] Set isVisibleForParticipants'),
    scoutableId: scoutableSchema.shape.id,
    value: z.boolean(),
});
export type SetIsVisibleForParticipantsAction = z.infer<
    typeof setIsVisibleForParticipantsActionSchema
>;

const markAsViewedActionSchema = z.strictObject({
    type: z.literal('[Scoutable] Mark as viewed'),
    scoutableId: scoutableSchema.shape.id,
});
export type MarkAsViewedAction = z.infer<typeof markAsViewedActionSchema>;

const renameActionSchema = z.strictObject({
    type: z.literal('[Scoutable] Rename'),
    scoutableId: scoutableSchema.shape.id,
    name: z.string(),
});
export type RenameAction = z.infer<typeof renameActionSchema>;

export namespace ScoutableActionReducers {
    export const makeElementScoutable: ActionReducer<MakeElementScoutableAction> =
        {
            type: makeElementScoutableActionSchema.shape.type.value,
            actionSchema: makeElementScoutableActionSchema,
            reducer: (draftState, { elementType, elementId, scoutable }) => {
                const element = getElement(draftState, elementType, elementId);
                element.scoutableId = scoutable.id;
                draftState.scoutables[scoutable.id] =
                    cloneDeepMutable(scoutable);

                return draftState;
            },
            rights: 'trainer',
        };
    export const setIsVisibleForParticipants: ActionReducer<SetIsVisibleForParticipantsAction> =
        {
            type: setIsVisibleForParticipantsActionSchema.shape.type.value,
            actionSchema: setIsVisibleForParticipantsActionSchema,
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
        type: updateScoutableContentActionSchema.shape.type.value,
        actionSchema: updateScoutableContentActionSchema,
        reducer: (draftState, { scoutableId, userGeneratedContent }) => {
            const element = getElement(draftState, 'scoutable', scoutableId);

            element.userGeneratedContent = userGeneratedContent;

            return draftState;
        },
        rights: 'trainer',
    };
    export const markAsViewed: ActionReducer<MarkAsViewedAction> = {
        type: markAsViewedActionSchema.shape.type.value,
        actionSchema: markAsViewedActionSchema,
        reducer: (draftState, { scoutableId }) => {
            const scoutable = getElement(draftState, 'scoutable', scoutableId);

            scoutable.viewedByParticipants = true;

            logScoutableViewed(draftState, scoutable.id);

            return draftState;
        },
        rights: 'participant',
    };
    export const rename: ActionReducer<RenameAction> = {
        type: renameActionSchema.shape.type.value,
        actionSchema: renameActionSchema,
        reducer: (draftState, { scoutableId, name }) => {
            const scoutable = getElement(draftState, 'scoutable', scoutableId);

            scoutable.name = name;

            return draftState;
        },
        rights: 'trainer',
    };
}
