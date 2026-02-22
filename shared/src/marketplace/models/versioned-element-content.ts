import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import { alarmGroupSchema } from '../../models/alarm-group.js';
import { vehicleTemplateSchema } from '../../models/vehicle-template.js';
import type { VersionedElementModel } from './versioned-element-model.js';
import { versionedElementModelSchema } from './versioned-element-model.js';

export const versionedElementContentSchema = z.discriminatedUnion('type', [
    vehicleTemplateSchema,
    alarmGroupSchema,
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

export function hasEntityProperties(
    element: object
): element is { entity: VersionedElementModel['entity'] } {
    if (!('entity' in element)) return false;
    return versionedElementModelSchema.shape.entity.safeParse(element.entity)
        .success;
}
