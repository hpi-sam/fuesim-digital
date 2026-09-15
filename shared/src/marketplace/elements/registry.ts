import { z } from 'zod';
import type { Immutable } from 'immer';
import type { MarketplaceRegistryEntry } from '../marketplace-registry-element.js';
import type { alarmGroupSchema } from '../../models/alarm-group.js';
import type { mapImageTemplateSchema } from '../../models/map-image-template.js';
import type { materialTemplateSchema } from '../../models/material-template.js';
import type { personnelTemplateSchema } from '../../models/personnel-template.js';
import type { vehicleTemplateSchema } from '../../models/vehicle-template.js';
import { marketplaceAlarmgroup } from './alarm-group.marketplace.js';
import { marketplaceMapImage } from './map-image-template.marketplace.js';
import { marketplaceMaterial } from './material.marketplace.js';
import { marketplacePersonnel } from './personnel.marketplace.js';
import { marketplaceVehicle } from './vehicle-template.marketplace.js';

export const marketplaceElements = [
    marketplaceVehicle,
    marketplaceAlarmgroup,
    marketplaceMaterial,
    marketplacePersonnel,
    marketplaceMapImage,
] as const satisfies readonly [
    MarketplaceRegistryEntry<typeof vehicleTemplateSchema>,
    MarketplaceRegistryEntry<typeof alarmGroupSchema>,
    MarketplaceRegistryEntry<typeof materialTemplateSchema>,
    MarketplaceRegistryEntry<typeof personnelTemplateSchema>,
    MarketplaceRegistryEntry<typeof mapImageTemplateSchema>,
];

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
