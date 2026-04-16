import * as z from 'zod';
import { UUID, uuid, uuidSchema } from '../utils/uuid.js';

export const userGeneratedContentIdSchema = uuidSchema.brand(
    'UserGeneratedContentId'
);
export type UserGeneratedContentId = z.infer<
    typeof userGeneratedContentIdSchema
>;

export const userGeneratedContentSchema = z.strictObject({
    id: userGeneratedContentIdSchema,
    type: z.literal('userGeneratedContent'),
    content: z.string(),
});
export type UserGeneratedContent = z.infer<typeof userGeneratedContentSchema>;

export function newUserGeneratedContent(uuidIn?: UUID): UserGeneratedContent {
    return {
        id:
            (uuidIn as UserGeneratedContentId) ??
            (uuid() as UserGeneratedContentId),
        type: 'userGeneratedContent',
        content: '',
    };
}
