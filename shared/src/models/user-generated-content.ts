import * as z from 'zod';
import type { Immutable } from 'immer';

export const userGeneratedContentSchema = z.strictObject({
    type: z.literal('userGeneratedContent'),
    content: z.string(),
});

export type UserGeneratedContent = Immutable<
    z.infer<typeof userGeneratedContentSchema>
>;

export function newUserGeneratedContent(): UserGeneratedContent {
    return {
        type: 'userGeneratedContent',
        content: '',
    };
}
