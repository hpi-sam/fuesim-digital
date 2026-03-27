import type { Immutable } from 'immer';
import * as z from 'zod';
import { uuidSchema } from '../utils/uuid.js';
import { imagePropertiesSchema } from './index.js';

export const measurePropertyTypeSchema = z.literal([
    'manualConfirm',
    'response',
]);

export const requiresAnyOfSchema = z.strictObject({
    anyOf: z.array(measurePropertyTypeSchema),
});

export type RequiresAnyOf = Immutable<z.infer<typeof requiresAnyOfSchema>>;

export const measurePropertyBaseSchema = z.strictObject({
    blockedBy: z.array(measurePropertyTypeSchema),
    requires: z.array(requiresAnyOfSchema),
});

export const manualConfirmPropertySchema = z.strictObject({
    type: z.literal('manualConfirm'),
    ...measurePropertyBaseSchema.shape,
});

export type ManualConfirmProperty = Immutable<
    z.infer<typeof manualConfirmPropertySchema>
>;

export const responsePropertySchema = z.strictObject({
    type: z.literal('response'),
    ...measurePropertyBaseSchema.shape,
    response: z.string(),
});

export type ResponseProperty = Immutable<
    z.infer<typeof responsePropertySchema>
>;

export const measurePropertySchema = z.union([
    manualConfirmPropertySchema,
    responsePropertySchema,
]);

export type MeasureProperty = Immutable<z.infer<typeof measurePropertySchema>>;

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
