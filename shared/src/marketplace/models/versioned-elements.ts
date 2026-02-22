import * as z from 'zod';
import type { ImmutableInfer } from '../../utils/infer.js';
import { versionedElementPartialSchema } from './versioned-id-schema.js';
import { stateVersionedEntitySchema } from './state-versioned-entity.js';
import { versionedElementContentSchema } from './versioned-element-content.js';

export const templateVersionSchema = z.object({
    ...stateVersionedEntitySchema.shape,
    ...versionedElementPartialSchema.shape,
    title: z.string(),
    description: z.string(),
    content: versionedElementContentSchema,
});

export type TemplateVersion = ImmutableInfer<typeof templateVersionSchema>;
export type TypedTemplateVersion<TContent> = Omit<
    TemplateVersion,
    'content'
> & {
    content: TContent;
};
