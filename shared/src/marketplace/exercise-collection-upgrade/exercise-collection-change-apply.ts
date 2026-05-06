import { z } from 'zod';
import { elementDtoSchema } from '../models/versioned-elements.js';
import { versionedElementContentSchema } from '../models/versioned-element-content.js';
import { collectionElementTypeSchema } from '../models/collection-element-type.js';
import { changeTargetSchema } from './exercise-collection-change-target.js';

export const sharedChangeApplySchema = z.object({
    marketplaceElement: elementDtoSchema,
    target: changeTargetSchema,
});

export const removeReplaceChangeApplySchema = z.object({
    type: z.literal('removed'),
    action: z.literal('replace'),
    replaceWith: versionedElementContentSchema,
    ...sharedChangeApplySchema.shape,
});

export type RemoveReplaceChangeApply = z.infer<
    typeof removeReplaceChangeApplySchema
>;

export const removeChangeApplySchema = z.discriminatedUnion('action', [
    z.object({
        type: z.literal('removed'),
        action: z.union([
            // Remove the element from the exercise at this target
            z.literal('remove'),
            // Orphan the element, i.e. keep it in the exercise but
            // remove the relationship to the marketplace
            z.literal('orphan'),
        ]),
        ...sharedChangeApplySchema.shape,
    }),
    removeReplaceChangeApplySchema,
]);

export type RemoveChangeApply = z.infer<typeof removeChangeApplySchema>;

export const editableChangeApplyActionSchema = z.literal(['keep', 'update']);

const editableBasicChangeApplySchema = z.object({
    type: z.literal('editable'),
    action: editableChangeApplyActionSchema,
    ...sharedChangeApplySchema.shape,
});

const editableCustomChangeApplySchema = z.object({
    type: z.literal('editable'),
    action: z.literal('replace'),
    newContent: z.string(),
    ...sharedChangeApplySchema.shape,
});

export const editableChangeApplySchema = z.discriminatedUnion('action', [
    editableBasicChangeApplySchema,
    editableCustomChangeApplySchema,
]);

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
