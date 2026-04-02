import * as z from 'zod';
import { uuid, uuidSchema } from '../utils/uuid.js';
import { scoutableSchema } from './index.js';

export const userGeneratedContentSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('userGeneratedContent'),
    content: z.string(),
});

export type UserGeneratedContent = z.infer<typeof userGeneratedContentSchema>;

export const userGeneratedContentAssignableElementSchema = z.union([
    scoutableSchema,
]);
export type UserGeneratedContentAssignableElement = z.infer<
    typeof userGeneratedContentAssignableElementSchema
>;

export type UserGeneratedContentAssignableElementType =
    UserGeneratedContentAssignableElement['type'];

export function newUserGeneratedContent(): UserGeneratedContent {
    return {
        id: uuid(),
        type: 'userGeneratedContent',
        content: '',
    };
}
