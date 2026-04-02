import * as z from 'zod';
import { uuid, uuidSchema } from '../utils/uuid.js';
import { scoutableSchema, type Scoutable } from './index.js';

export const userGeneratedContentSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('userGeneratedContent'),
    content: z.string(),
});

export type UserGeneratedContent = z.infer<typeof userGeneratedContentSchema>;

export const UserGeneratedContentAssignableElementSchema = z.union([
    scoutableSchema,
]);
export type UserGeneratedContentAssignableElement = z.infer<
    typeof UserGeneratedContentAssignableElementSchema
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
