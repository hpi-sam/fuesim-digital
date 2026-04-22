import * as z from 'zod';

export const userGeneratedContentSchema = z.strictObject({
    type: z.literal('userGeneratedContent'),
    content: z.string(),
});
export type UserGeneratedContent = z.infer<typeof userGeneratedContentSchema>;

export function newUserGeneratedContent(): UserGeneratedContent {
    return {
        type: 'userGeneratedContent',
        content: '',
    };
}
