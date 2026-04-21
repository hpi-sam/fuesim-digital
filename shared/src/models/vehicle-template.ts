import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../utils/uuid.js';
import { versionedElementModel } from '../marketplace/models/versioned-element-model.js';
import { imagePropertiesSchema } from './utils/image-properties.js';

export const vehicleTemplateSchema = z.strictObject({
    ...versionedElementModel.partial().shape,
    id: uuidSchema,
    type: z.literal('vehicleTemplate'),
    vehicleType: z.string(),
    name: z.string(),
    image: imagePropertiesSchema,
    patientCapacity: z.number(),
    personnelTemplateIds: z.array(uuidSchema),
    materialTemplateIds: z.array(uuidSchema),
});

export type VehicleTemplate = Immutable<z.infer<typeof vehicleTemplateSchema>>;
