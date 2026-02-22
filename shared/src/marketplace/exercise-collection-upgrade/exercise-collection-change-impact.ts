import { z } from 'zod';
import { templateVersionSchema } from '../models/marketplace-element.js';
import { changeTargetSchema } from './exercise-collection-change-target.js';
import type { ImmutableInfer } from './../../utils/infer.js';
import { collectionUpgradeChangeElementSchema } from './exercise-collection-change-element.js';

const sharedChangeImpactPropertiesSchema = z.object({
    id: z.string(),
    entity: templateVersionSchema,
    target: changeTargetSchema,
});

export const addedElementChangeImpactSchema = z.object({
    ...sharedChangeImpactPropertiesSchema.shape,
    type: z.literal('added'),
});

export type AddedElementChangeImpact = ImmutableInfer<
    typeof addedElementChangeImpactSchema
>;

export const removedElementChangeImpactSchema = z.object({
    ...sharedChangeImpactPropertiesSchema.shape,
    type: z.literal('removed'),
    element: collectionUpgradeChangeElementSchema,
});

export type RemovedElementChangeImpact = ImmutableInfer<
    typeof removedElementChangeImpactSchema
>;

export const editableElementChangeImpactSchema = z.object({
    ...sharedChangeImpactPropertiesSchema.shape,
    type: z.literal('updated'),
    editedValue: z.object({
        id: z.string(),
        name: z.string(),
        template: z.string(),
        model: z.string(),
    }),
    element: collectionUpgradeChangeElementSchema,
});

export type EditableElementChangeImpact = ImmutableInfer<
    typeof editableElementChangeImpactSchema
>;

export const changeImpactSchema = z.discriminatedUnion('type', [
    addedElementChangeImpactSchema,
    editableElementChangeImpactSchema,
    removedElementChangeImpactSchema,
]);

export type ChangeImpact = ImmutableInfer<typeof changeImpactSchema>;
