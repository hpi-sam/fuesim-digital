import * as z from 'zod';
import type { Immutable } from 'immer';
import { versionedElementPartialSchema } from './versioned-id-schema.js';
import { stateVersionedEntitySchema } from './state-versioned-entity.js';

// This seperation is required to prevent circular dependencies
export const contentlessTemplateVersionSchema = z.object({
    ...stateVersionedEntitySchema.shape,
    ...versionedElementPartialSchema.shape,
    title: z.string(),
    description: z.string(),
});

export type ContentlessTemplateVersion = Immutable<
    z.infer<typeof contentlessTemplateVersionSchema>
>;
