import * as z from 'zod';
import type { Immutable } from 'immer';
import { versionedElementContentSchema } from './versioned-element-content.js';
import { contentlessTemplateVersionSchema } from './versioned-elements-contentless.js';

export const templateVersionSchema = z.object({
    ...contentlessTemplateVersionSchema.shape,
    content: versionedElementContentSchema,
});

export type TemplateVersion = Immutable<z.infer<typeof templateVersionSchema>>;
export type TypedTemplateVersion<
    TContent,
    T extends TemplateVersion = TemplateVersion,
> = Omit<T, 'content'> & {
    content: TContent;
};
