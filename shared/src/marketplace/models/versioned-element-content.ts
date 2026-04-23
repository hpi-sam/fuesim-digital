import { z } from 'zod';
import type { Immutable } from 'immer';
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

export type VersionedElementContent = Immutable<
    z.infer<typeof versionedElementContentSchema>
>;

export type DefinitelyVersionedElementContent = VersionedElementContent & {
    versionId: ElementVersionId;
    entityId: ElementEntityId;
};

export function isDefinitelyVersionedElementContent(
    content: VersionedElementContent
): content is DefinitelyVersionedElementContent {
    return content.versionId !== undefined && content.entityId !== undefined;
}
