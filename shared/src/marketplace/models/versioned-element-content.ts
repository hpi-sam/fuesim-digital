import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import { alarmGroupSchema } from '../../models/alarm-group.js';
import { vehicleTemplateSchema } from '../../models/vehicle-template.js';
import { personnelTemplateSchema } from '../../models/personnel-template.js';
import { materialTemplateSchema } from '../../models/material-template.js';
import { mapImageTemplateSchema } from '../../models/map-image-template.js';
import { versionedElementModelSchema } from './versioned-element-model.js';
export {
    type VersionedElementModel,
    versionedElementModelSchema,
} from './versioned-element-model.js';

export const templateVersionContentSchema = z.discriminatedUnion('type', [
    vehicleTemplateSchema,
    alarmGroupSchema,
    personnelTemplateSchema,
    materialTemplateSchema,
    mapImageTemplateSchema,
]);

export const TemplateVersionContentAllowedTypes =
    templateVersionContentSchema.options.map(
        (option) => option.shape.type.value
    );

export type TemplateVersionContent = Immutable<
    z.infer<typeof templateVersionContentSchema>
>;

export function isTemplateVersionContent(
    content: any
): content is WritableDraft<TemplateVersionContent> {
    return templateVersionContentSchema.safeParse(content).success;
}

export const definitelytemplateVersionContentSchema = z.union(
    // We want to enforce "entity" (from versionedElementModelSchema)
    // to be present in every option of templateVersionContentSchema
    templateVersionContentSchema.options.map((option) =>
        z.object({
            ...option.shape,
            ...versionedElementModelSchema.shape,
        })
    )
);

export type DefinitelyTemplateVersionContent = Immutable<
    z.infer<typeof definitelytemplateVersionContentSchema>
>;
