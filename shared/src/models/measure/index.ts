import type { Immutable } from 'immer';
import * as z from 'zod';
import { uuidSchema } from '../../utils/uuid.js';
import { imagePropertiesSchema } from '../index.js';
import { measurePropertySchema } from './properties.js';

export const measureTemplateSchema = z.strictObject({
    id: uuidSchema,
    name: z.string(),
    image: imagePropertiesSchema,
    properties: z.array(measurePropertySchema),
});

export type MeasureTemplate = Immutable<z.infer<typeof measureTemplateSchema>>;

export const measureSchema = z.strictObject({
    id: uuidSchema,
    timestamp: z.number(),
    clientName: z.string(),
    template: uuidSchema,
});

export type Measure = Immutable<z.infer<typeof measureSchema>>;

export * from './properties.js';
