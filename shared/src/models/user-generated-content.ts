import * as z from 'zod';
import { uuid, uuidSchema } from '../utils/uuid.js';
import { scoutableSchema, type Scoutable } from './index.js';

export const userGeneratedContentSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('userGeneratedContent'),
    content: z.string(),
});

export type UserGeneratedContent = z.infer<typeof userGeneratedContentSchema>;

export const contentAssignableElementSchema = z.union([scoutableSchema]);
export type ContentAssignableElement = z.infer<
    typeof contentAssignableElementSchema
>;

export type ContentAssignableElementType = ContentAssignableElement['type'];

export function newUserGeneratedContent(): UserGeneratedContent {
    return {
        id: uuid(),
        type: 'userGeneratedContent',
        content: '',
    };
}
