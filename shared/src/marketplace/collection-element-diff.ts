import { z } from 'zod';
import type { ImmutableInfer } from '../utils/infer.js';
import type { TemplateVersion } from './models/marketplace-element.js';
import { templateVersionSchema } from './models/marketplace-element.js';
import type { ElementVersionId } from './models/versioned-id-schema.js';
import { elementVersionIdSchema } from './models/versioned-id-schema.js';

const deletedTemplateVersionSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('remove'),
    old: templateVersionSchema,
    new: z.null(),
});

const updatedTemplateVersionSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('update'),
    old: templateVersionSchema,
    new: templateVersionSchema,
});

const addedTemplateVersionSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('create'),
    old: z.null(),
    new: templateVersionSchema,
});

export const changedTemplateVersionSchema = z.union([
    deletedTemplateVersionSchema,
    updatedTemplateVersionSchema,
    addedTemplateVersionSchema,
]);

export type ChangeElementType = ImmutableInfer<
    typeof changedTemplateVersionSchema
>['type'];

export type ChangedTemplateVersion = ImmutableInfer<
    typeof changedTemplateVersionSchema
>;

export const changeDependenciesSchema = z.record(
    elementVersionIdSchema,
    z.array(templateVersionSchema)
);

export type ChangeDependencies = { [T in ElementVersionId]: TemplateVersion[] };
