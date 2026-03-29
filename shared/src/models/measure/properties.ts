import type { Immutable } from 'immer';
import { z } from 'zod';

// ========== General ==========
export const measurePropertyTypeSchema = z.literal([
    'manualConfirm',
    'response',
    'delay',
]);

export type MeasurePropertyType = Immutable<
    z.infer<typeof measurePropertyTypeSchema>
>;

// ========== Dependencies ==========
export const requiresAnyOfSchema = z.strictObject({
    anyOf: z.array(measurePropertyTypeSchema),
});

export type RequiresAnyOf = Immutable<z.infer<typeof requiresAnyOfSchema>>;

export const measurePropertyDefinitionSchema = z.strictObject({
    blockedBy: z.array(measurePropertyTypeSchema),
    requires: z.array(requiresAnyOfSchema),
});

export type MeasurePropertyDefinition = Immutable<
    z.infer<typeof measurePropertyDefinitionSchema>
>;

export const measurePropertyDefinitions: {
    [key in MeasurePropertyType]: MeasurePropertyDefinition;
} = {
    manualConfirm: { blockedBy: [], requires: [] },
    response: { blockedBy: [], requires: [] },
    delay: { blockedBy: [], requires: [] },
};

// ========== Properties ==========
export const manualConfirmPropertySchema = z.strictObject({
    type: z.literal('manualConfirm'),
    prompt: z.string(),
    confirmationString: z.string().optional(),
});

export type ManualConfirmProperty = Immutable<
    z.infer<typeof manualConfirmPropertySchema>
>;

export const responsePropertySchema = z.strictObject({
    type: z.literal('response'),
    response: z.string(),
});

export type ResponseProperty = Immutable<
    z.infer<typeof responsePropertySchema>
>;

export const delayPropertySchema = z.strictObject({
    type: z.literal('delay'),
    delay: z.number().positive(),
});

export type DelayProperty = Immutable<z.infer<typeof delayPropertySchema>>;

// ========== Final ==========
export const measurePropertySchema = z.union([
    manualConfirmPropertySchema,
    responsePropertySchema,
    delayPropertySchema,
]);

export type MeasureProperty = Immutable<z.infer<typeof measurePropertySchema>>;
