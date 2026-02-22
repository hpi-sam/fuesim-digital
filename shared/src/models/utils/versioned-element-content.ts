import * as z from 'zod';
import { alarmGroupSchema } from '../alarm-group.js';
import { vehicleTemplateSchema } from '../vehicle-template.js';
import { stateVersionedEntitySchema } from '../state-versioned-entity.js';
import {
    elementVersionIdSchema,
    elementEntityIdSchema,
} from '../versioned-elements.js';

export const versionedElementContentSchema = z.union([
    vehicleTemplateSchema,
    alarmGroupSchema,
]);

export type VersionedElementContent = z.infer<
    typeof versionedElementContentSchema
>;

// INFO: This needs to be seperate form versioned-element to prevent circular dependencies
export const elementDtoSchema = z.object({
    ...stateVersionedEntitySchema.shape,
    versionId: elementVersionIdSchema,
    entityId: elementEntityIdSchema,
    title: z.string(),
    description: z.string(),
    content: versionedElementContentSchema,
});

export type ElementDto = z.infer<typeof elementDtoSchema>;
export type TypedElementDto<TContent> = Omit<ElementDto, 'content'> & {
    content: TContent;
};
