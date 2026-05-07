import * as z from 'zod';
import type { Immutable } from 'immer';
import { marketplaceElementContentSchema } from '../elements/marketplace-elements.js';
import { versionedElementPartialSchema } from './versioned-id-schema.js';
import { stateVersionedEntitySchema } from './state-versioned-entity.js';

export const elementDtoSchema = z.object({
    ...stateVersionedEntitySchema.shape,
    ...versionedElementPartialSchema.shape,
    title: z.string(),
    description: z.string(),
    content: marketplaceElementContentSchema,
});

export type ElementDto = Immutable<z.infer<typeof elementDtoSchema>>;
export type TypedElementDto<TContent> = Omit<ElementDto, 'content'> & {
    content: TContent;
};
