import * as z from 'zod';
import type { Immutable } from 'immer';
import { templateVersionContentSchema } from './versioned-element-content.js';
import { stateVersionedEntitySchema } from './state-versioned-entity.js';
import { versionedElementPartialSchema } from './versioned-id-schema.js';

// Make sure this type is up to date with the schema
export const templateVersionSchema = z.object({
    ...stateVersionedEntitySchema.shape,
    ...versionedElementPartialSchema.shape,
    title: z.string(),
    description: z.string(),
    content: templateVersionContentSchema,
});

export type TemplateVersion = Immutable<z.infer<typeof templateVersionSchema>>;
export type TypedTemplateVersion<
    TContent,
    T extends TemplateVersion = TemplateVersion,
> = Omit<T, 'content'> & {
    content: TContent;
};
