import { z } from 'zod';
import { elementDtoSchema } from '../models/versioned-elements.js';
import { changeTargetSchema } from './exercise-collection-change-target.js';
import { collectionUpgradeChangeElementSchema } from './exercise-collection-change-element.js';

const sharedChangeImpactPropertiesSchema = z.object({
    id: z.string(),
    entity: elementDtoSchema,
    target: changeTargetSchema,
});

export const addedElementChangeImpactSchema = z.object({
    ...sharedChangeImpactPropertiesSchema.shape,
    type: z.literal('added'),
});

export type AddedElementChangeImpact = z.infer<
    typeof addedElementChangeImpactSchema
>;

export const removedElementChangeImpactSchema = z.object({
    ...sharedChangeImpactPropertiesSchema.shape,
    type: z.literal('removed'),
    element: collectionUpgradeChangeElementSchema,
});

export type RemovedElementChangeImpact = z.infer<
    typeof removedElementChangeImpactSchema
>;

export const editableElementChangeImpactSchema = z.object({
    ...sharedChangeImpactPropertiesSchema.shape,
    type: z.literal('updated'),
    // is this value is not set, no user action is required
    editedValue: z
        .object({
            id: z.string(),
            name: z.string(),
            template: z.string(),
            model: z.string(),
        })
        .optional(),
    element: collectionUpgradeChangeElementSchema,
});

export type EditableElementChangeImpact = z.infer<
    typeof editableElementChangeImpactSchema
>;

export const changeImpactSchema = z.discriminatedUnion('type', [
    addedElementChangeImpactSchema,
    editableElementChangeImpactSchema,
    removedElementChangeImpactSchema,
]);

export type ChangeImpact = z.infer<typeof changeImpactSchema>;
