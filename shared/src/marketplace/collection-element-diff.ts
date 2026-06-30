import { z } from 'zod';
import type { ImmutableInfer } from '../utils/infer.js';
import { elementVersionIdSchema } from './models/versioned-id-schema.js';
import { templateVersionSchema } from './models/versioned-elements.js';

const deletedElementSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('remove'),
    old: templateVersionSchema,
    new: z.null(),
});

const updatedElementSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('update'),
    old: templateVersionSchema,
    new: templateVersionSchema,
});

const addedElementSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('create'),
    old: z.null(),
    new: templateVersionSchema,
});

export const changedElementSchema = z.union([
    deletedElementSchema,
    updatedElementSchema,
    addedElementSchema,
]);

export type ChangeElementType = ImmutableInfer<
    typeof changedElementSchema
>['type'];

export type ChangedElementDto = ImmutableInfer<typeof changedElementSchema>;
