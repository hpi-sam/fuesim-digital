import { z } from 'zod';
import { elementSchema } from '../models/element.js';
import { elementDtoSchema } from './models/versioned-elements.js';


// IMPACT
export const addedElementChangeImpactSchema = z.object({
    id: z.string(),
    type: z.literal('added'),
    entity: elementDtoSchema,
});

export type AddedElementChangeImpact = z.infer<typeof addedElementChangeImpactSchema>;


export const removedElementChangeImpactSchema = z.object({
    id: z.string(),
    type: z.literal('removed'),
    element: elementSchema,
    entity: elementDtoSchema,
});

export type RemovedElementChangeImpact = z.infer<typeof removedElementChangeImpactSchema>;

export const editableElementChangeImpactSchema = z.object({
    id: z.string(),
    type: z.literal('updated'),
    editedValues: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            template: z.string(),
            model: z.string(),
        })
    ),
    element: elementSchema,
    entity: elementDtoSchema,
});

export type EditableElementChangeImpact = z.infer<typeof editableElementChangeImpactSchema>;


export const changeImpactSchema = z.discriminatedUnion('type', [
    addedElementChangeImpactSchema,
    editableElementChangeImpactSchema,
    removedElementChangeImpactSchema,
]);

export type ChangeImpact = z.infer<typeof changeImpactSchema>;


// CHANGE APPLY

export const removeChangeApplyActionSchema = z.literal([
    'remove',
    'replace',
    'placeholder',
]);


export const removeChangeApplySchema = z.object({
    type: z.literal('removed'),
    change: removedElementChangeImpactSchema,
    action: removeChangeApplyActionSchema,
    replaceWith: elementDtoSchema.optional(),
})

export type RemoveChangeApply = z.infer<typeof removeChangeApplySchema>;

export const editableChangeApplyActionSchema = z.literal(['keep', 'update']);

export const editableChangeApplySchema = z.object({
    type: z.literal('editable'),
    change: editableElementChangeImpactSchema,
    action: editableChangeApplyActionSchema,
});

export type EditableChangeApply = z.infer<typeof editableChangeApplySchema>;

export const addedChangeApplySchema = z.object({
    type: z.literal('added'),
    change: addedElementChangeImpactSchema,
    action: z.literal('keep'),
});

export type AddedChangeApply = z.infer<typeof addedChangeApplySchema>;

export const changeApplySchema = z.discriminatedUnion('type', [
    removeChangeApplySchema,
    editableChangeApplySchema,
    addedChangeApplySchema,
]);

export type ChangeApply = z.infer<typeof changeApplySchema>;
