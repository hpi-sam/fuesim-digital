import { z } from 'zod';
import type { Immutable } from 'immer';
import { marketplaceAlarmGroup } from './alarm-group.marketplace.js';
import { marketplaceMapImage } from './map-image-template.marketplace.js';
import { marketplaceMaterial } from './material.marketplace.js';
import { marketplacePersonnel } from './personnel.marketplace.js';
import { marketplaceVehicle } from './vehicle-template.marketplace.js';

export const marketplaceElements = [
    marketplaceVehicle,
    marketplaceAlarmGroup,
    marketplaceMaterial,
    marketplacePersonnel,
    marketplaceMapImage,
] as const;

type MarketplaceElements = typeof marketplaceElements;
type TemplateSchema = MarketplaceElements[number]['templateSchema'];
const templateSchemas = marketplaceElements.map(
    (entry) => entry.templateSchema
) as [TemplateSchema, ...TemplateSchema[]];

export const marketplaceElementContentSchema = z.discriminatedUnion(
    'type',
    templateSchemas
);

export type MarketplaceElementContent = Immutable<
    z.infer<typeof marketplaceElementContentSchema>
>;
