import * as z from 'zod';
import { uuid } from '../utils/uuid.js';
import type { Scoutable } from './index.js';

export const userGeneratedContentSchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('userGeneratedContent'),
    content: z.string(),
});

export type UserGeneratedContent = z.infer<typeof userGeneratedContentSchema>;

export type ContentAssignableElement = Scoutable;

export type ContentAssignableElementType = ContentAssignableElement['type'];

export function newUserGeneratedContent(): UserGeneratedContent {
    return {
        id: uuid(),
        type: 'userGeneratedContent',
        content: '',
    };
}
