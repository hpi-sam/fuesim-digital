import { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';
import { measurePropertySchema } from './properties.js';

export const measureTemplateSchema = z.strictObject({
    id: uuidSchema,
    name: z.string(),
    properties: z.array(measurePropertySchema),
});

export type MeasureTemplate = z.infer<typeof measureTemplateSchema>;

export const measureSchema = z.strictObject({
    id: uuidSchema,
    timestamp: z.number(),
    clientName: z.string(),
    template: uuidSchema,
});

export type Measure = z.infer<typeof measureSchema>;
