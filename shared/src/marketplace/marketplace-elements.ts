import type { WritableDraft, Immutable } from 'immer';
import { z } from 'zod';
import { alarmGroupSchema } from '../models/alarm-group.js';
import { vehicleTemplateSchema } from '../models/vehicle-template.js';
import { personnelTemplateSchema } from '../models/personnel-template.js';
import { materialTemplateSchema } from '../models/material-template.js';
import { mapImageTemplateSchema } from '../models/map-image-template.js';
import type { VersionedElementModel } from './models/versioned-element-content.js';
import { versionedElementModelSchema } from './models/versioned-element-content.js';
import { marketplaceElements } from './elements/registry.js';

export { marketplaceElements } from './elements/registry.js';

export const marketplaceElementContentSchema = z.discriminatedUnion('type', [
    alarmGroupSchema,
    vehicleTemplateSchema,
    personnelTemplateSchema,
    materialTemplateSchema,
    mapImageTemplateSchema,
]);

export type MarketplaceElementContent = Immutable<
    z.infer<typeof marketplaceElementContentSchema>
>;

export function getMarketplaceElementByType(type: string) {
    const element = marketplaceElements.find((e) => e.types.includes(type));
    if (!element) {
        throw new Error(`No marketplace element found for type: ${ type }`);
    }
    return element;
}

export function isMarketplaceElementContent(
    content: any
): content is WritableDraft<MarketplaceElementContent> {
    return marketplaceElementContentSchema.safeParse(content).success;
}

export const versionedMarketplaceElementContentSchema = z.union(
    // We want to enforce "entity" (from versionedElementModelSchema)
    // to be present in every option of templateVersionContentSchema
    marketplaceElementContentSchema.options.map((option) =>
        z.object({
            ...option.shape,
            ...versionedElementModelSchema.shape,
        })
    )
);

export type VersionedMarketplaceElementContent = Immutable<
    z.infer<typeof versionedMarketplaceElementContentSchema>
>;

export function hasEntityProperties(
    element: object
): element is { entity: VersionedElementModel['entity'] } {
    if (!('entity' in element)) return false;
    return versionedElementModelSchema.shape.entity.safeParse(element.entity)
        .success;
}
