import { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';

export const measurePropertyTypeSchema = z.literal([
    'manualConfirm',
    'response',
    'delay',
    'alarm',
    'eocLog',
]);

export type MeasurePropertyType = z.infer<typeof measurePropertyTypeSchema>;

// ==================================================

export const requiresAnyOfSchema = z.strictObject({
    anyOf: z.array(measurePropertyTypeSchema),
});

export type RequiresAnyOf = z.infer<typeof requiresAnyOfSchema>;

export const measurePropertyDefinitionSchema = z.strictObject({
    blockedBy: z.array(measurePropertyTypeSchema),
    requires: z.array(requiresAnyOfSchema),
});

export type MeasurePropertyDefinition = z.infer<
    typeof measurePropertyDefinitionSchema
>;

export const measurePropertyDefinitions: {
    [key in MeasurePropertyType]: MeasurePropertyDefinition;
} = {
    manualConfirm: { blockedBy: [], requires: [] },
    response: { blockedBy: [], requires: [] },
    delay: {
        blockedBy: [],
        requires: [{ anyOf: [...measurePropertyTypeSchema.values] }],
    },
    alarm: { blockedBy: [], requires: [{ anyOf: ['manualConfirm'] }] },
    eocLog: { blockedBy: [], requires: [] },
};

// ==================================================

export const manualConfirmPropertySchema = z.strictObject({
    type: z.literal('manualConfirm'),
    prompt: z.string(),
    confirmationString: z.string().optional(),
});

export type ManualConfirmProperty = z.infer<typeof manualConfirmPropertySchema>;

export const responsePropertySchema = z.strictObject({
    type: z.literal('response'),
    response: z.string(),
});

export type ResponseProperty = z.infer<typeof responsePropertySchema>;

export const delayPropertySchema = z.strictObject({
    type: z.literal('delay'),
    delay: z.number().positive(),
});

export type DelayProperty = z.infer<typeof delayPropertySchema>;

export const alarmPropertySchema = z.strictObject({
    type: z.literal('alarm'),
    alarmGroups: z.array(uuidSchema),
    targetTransferPointIds: z.array(uuidSchema),
});

export type AlarmProperty = z.infer<typeof alarmPropertySchema>;

export const eocLogPropertySchema = z.strictObject({
    type: z.literal('eocLog'),
    message: z.string().optional(),
});

export type EocLogProperty = z.infer<typeof eocLogPropertySchema>;

// ==================================================

export const measurePropertySchema = z.union([
    manualConfirmPropertySchema,
    responsePropertySchema,
    delayPropertySchema,
    alarmPropertySchema,
    eocLogPropertySchema,
]);

export type MeasureProperty = z.infer<typeof measurePropertySchema>;
