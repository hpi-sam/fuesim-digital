import { z } from 'zod';
import { imagePropertiesSchema } from './utils/index.js';

export const vehicleTemplateSchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('vehicleTemplate'),
    vehicleType: z.string(),
    name: z.string(),
    image: imagePropertiesSchema,
    patientCapacity: z.number(),
    personnelTemplateIds: z.array(z.uuidv4()),
    materialTemplateIds: z.array(z.uuidv4()),
});

export type VehicleTemplate = z.infer<typeof vehicleTemplateSchema>;
