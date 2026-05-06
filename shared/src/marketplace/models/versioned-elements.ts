import * as z from 'zod';
import { castImmutable } from 'immer';
import { versionedElementPartialSchema } from './versioned-id-schema.js';
import { stateVersionedEntitySchema } from './state-versioned-entity.js';
import { versionedElementContentSchema } from './versioned-element-content.js';

export const elementDtoSchema = z.object({
    ...stateVersionedEntitySchema.shape,
    ...versionedElementPartialSchema.shape,
    title: z.string(),
    description: z.string(),
    // .readonly() is not deep enough and .deepReadonly() is marked as not planned by zod
    content: versionedElementContentSchema.transform((t) => castImmutable(t)),
});

export type ElementDto = z.infer<typeof elementDtoSchema>;
export type TypedElementDto<TContent> = Omit<ElementDto, 'content'> & {
    content: TContent;
};
