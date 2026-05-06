import * as z from 'zod';
import type { Immutable } from 'immer';
import { versionedElementPartialSchema } from './versioned-id-schema.js';
import { stateVersionedEntitySchema } from './state-versioned-entity.js';
import { versionedElementContentSchema } from './versioned-element-content.js';

export const elementDtoSchema = z.object({
    ...stateVersionedEntitySchema.shape,
    ...versionedElementPartialSchema.shape,
    title: z.string(),
    description: z.string(),
    content: versionedElementContentSchema,
});

export type ElementDto = Immutable<z.infer<typeof elementDtoSchema>>;
export type TypedElementDto<TContent> = Omit<ElementDto, 'content'> & {
    content: TContent;
};
