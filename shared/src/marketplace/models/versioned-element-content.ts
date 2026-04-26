import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import { alarmGroupSchema } from '../../models/alarm-group.js';
import { vehicleTemplateSchema } from '../../models/vehicle-template.js';
import type {
    ElementEntityId,
    ElementVersionId,
} from './versioned-id-schema.js';

export const versionedElementContentSchema = z.union([
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

export type DefinitelyVersionedElementContent = VersionedElementContent & {
    versionId: ElementVersionId;
    entityId: ElementEntityId;
};

export function isDefinitelyVersionedElementContent(
    content: VersionedElementContent
): content is DefinitelyVersionedElementContent {
    return content.versionId !== undefined && content.entityId !== undefined;
}
