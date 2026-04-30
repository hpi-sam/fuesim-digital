import { z } from 'zod';
import { elementDtoSchema } from '../models/versioned-elements.js';
import { versionedElementContentSchema } from '../models/versioned-element-content.js';
import { collectionElementTypeSchema } from '../models/collection-element-type.js';
import { changeTargetSchema } from './exercise-collection-change-target.js';

export const sharedChangeApplySchema = z.object({
    marketplaceElement: elementDtoSchema,
    target: changeTargetSchema,
});

export const removeChangeApplySchema = z.discriminatedUnion('action', [
    z.object({
        type: z.literal('removed'),
        action: z.literal('remove'),
        ...sharedChangeApplySchema.shape,
    }),
    z.object({
        type: z.literal('removed'),
        action: z.literal('replace'),
        replaceWith: versionedElementContentSchema,
        ...sharedChangeApplySchema.shape,
    }),
]);

export type RemoveChangeApply = z.infer<typeof removeChangeApplySchema>;

export const editableChangeApplyActionSchema = z.literal(['keep', 'update']);

export const editableChangeApplySchema = z.object({
    type: z.literal('editable'),
    action: editableChangeApplyActionSchema,
    ...sharedChangeApplySchema.shape,
});

export type EditableChangeApply = z.infer<typeof editableChangeApplySchema>;

export const addedChangeApplySchema = z.object({
    type: z.literal('added'),
    action: z.literal('keep'),
    collectionElementType: collectionElementTypeSchema,
    ...sharedChangeApplySchema.shape,
});

export type AddedChangeApply = z.infer<typeof addedChangeApplySchema>;

export const changeApplySchema = z.discriminatedUnion('type', [
    removeChangeApplySchema,
    editableChangeApplySchema,
    addedChangeApplySchema,
]);

export type ChangeApply = z.infer<typeof changeApplySchema>;
