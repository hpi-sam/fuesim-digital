import { z } from 'zod';
import type { ImmutableInfer } from '../utils/infer.js';
import { elementVersionIdSchema } from './models/versioned-id-schema.js';
import { templateVersionSchema } from './models/versioned-elements.js';

const deletedElementDtoSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('remove'),
    old: templateVersionSchema,
    new: z.null(),
});

const updatedElementDtoSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('update'),
    old: templateVersionSchema,
    new: templateVersionSchema,
});

const addedElementDtoSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('create'),
    old: z.null(),
    new: templateVersionSchema,
});

export const changedElementDtoSchema = z.union([
    deletedElementDtoSchema,
    updatedElementDtoSchema,
    addedElementDtoSchema,
]);

export type ChangeElementType = ImmutableInfer<
    typeof changedElementDtoSchema
>['type'];

export type ChangedElementDto = ImmutableInfer<typeof changedElementDtoSchema>;
