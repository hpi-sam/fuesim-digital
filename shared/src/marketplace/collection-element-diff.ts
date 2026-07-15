import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ElementVersionId } from './models/versioned-id-schema.js';
import { elementVersionIdSchema } from './models/versioned-id-schema.js';
import {
    templateVersionSchema,
    type TemplateVersion,
} from './models/versioned-elements.js';

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

export type ChangeElementType = Immutable<
    z.infer<typeof changedTemplateVersionSchema>
>['type'];

export type ChangedTemplateVersion = Immutable<
    z.infer<typeof changedTemplateVersionSchema>
>;

export const changeDependenciesSchema = z.record(
    elementVersionIdSchema,
    z.array(templateVersionSchema)
);

export type ChangeDependencies = { [T in ElementVersionId]: TemplateVersion[] };
