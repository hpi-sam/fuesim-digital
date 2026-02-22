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
    versionedElementModelStateExtension,
} from './versioned-element-model.js';

export const versionedElementContentSchema = z.discriminatedUnion('type', [
    vehicleTemplateSchema,
    alarmGroupSchema,
    personnelTemplateSchema,
    materialTemplateSchema,
    mapImageTemplateSchema,
]);

export const versionedElementContentAllowedTypes =
    versionedElementContentSchema.options.map(
        (option) => option.shape.type.value
    );

export type VersionedElementContent = Immutable<
    z.infer<typeof versionedElementContentSchema>
>;

export function isVersionedElementContent(
    content: any
): content is WritableDraft<VersionedElementContent> {
    return versionedElementContentSchema.safeParse(content).success;
}

export const definitelyVersionedElementContentSchema = z.union(
    // We want to enforce "entity" (from versionedElementModelSchema)
    // to be present in every option of versionedElementContentSchema
    versionedElementContentSchema.options.map((option) =>
        z.object({
            ...option.shape,
            ...versionedElementModelSchema.shape,
        })
    )
);

export type DefinitelyVersionedElementContent = Immutable<
    z.infer<typeof definitelyVersionedElementContentSchema>
>;
