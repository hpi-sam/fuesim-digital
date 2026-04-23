import { z } from 'zod';
import { alarmGroupSchema } from '../alarm-group.js';
import { transferPointSchema } from '../transfer-point.js';
import { validationMessages } from '../../validation-messages.js';

export const measurePropertyTypeSchema = z.literal([
    'manualConfirm',
    'response',
    'delay',
    'alarm',
    'eocLog',
    'drawFreehand',
    'drawLine',
]);

export type MeasurePropertyType = z.infer<typeof measurePropertyTypeSchema>;

export const measurePropertyTypeToGermanNameDictionary: {
    [Key in MeasurePropertyType]: string;
} = {
    manualConfirm: 'Manuelle Bestätigung',
    response: 'Rückmeldung',
    delay: 'Verzögerung',
    alarm: 'Alarmierung',
    eocLog: 'Einsatztagebucheintrag',
    drawFreehand: 'Freihandzeichnung',
    drawLine: 'Linienzeichnung',
};

export const measurePropertyTypeToDefaultHint: {
    [Key in MeasurePropertyType]: string;
} = {
    manualConfirm: '',
    response: '',
    delay: 'Bitte warten Sie',
    alarm: '',
    eocLog: '',
    drawFreehand: 'Jetzt frei Bereich einzeichnen (gedrückt halten)',
    drawLine:
        'Jetzt eine Linie einzeichnen (einfacher Klick um neuen Punkt zu setzen, doppelter Klick für Schlusspunkt)',
};

const trimmedOptionalString = z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().optional()
);

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
        requires: [
            {
                anyOf: [...measurePropertyTypeSchema.values].filter(
                    (pt) => pt !== 'delay'
                ),
            },
        ],
    },
    alarm: { blockedBy: [], requires: [] },
    eocLog: { blockedBy: [], requires: [] },
    drawFreehand: { blockedBy: [], requires: [] },
    drawLine: { blockedBy: [], requires: [] },
};

export const propertyBaseSchema = z.strictObject({
    hint: z.string(),
});

export const manualConfirmPropertySchema = z.strictObject({
    type: z.literal('manualConfirm'),
    ...propertyBaseSchema.shape,
    prompt: z.string().nonempty({
        error: validationMessages.required,
    }),
    confirmationString: trimmedOptionalString,
});

export type ManualConfirmProperty = z.infer<typeof manualConfirmPropertySchema>;

export const responsePropertySchema = z.strictObject({
    type: z.literal('response'),
    ...propertyBaseSchema.shape,
    response: z.string().nonempty({ error: validationMessages.required }),
});

export type ResponseProperty = z.infer<typeof responsePropertySchema>;

export const delayPropertySchema = z.strictObject({
    type: z.literal('delay'),
    ...propertyBaseSchema.shape,
    delay: z
        .int({ error: 'Die Dauer der Verzögerung muss eine Zahl sein' })
        .positive({ error: 'Die Dauer der Verzögerung muss positiv sein' }),
});

export type DelayProperty = z.infer<typeof delayPropertySchema>;

export const alarmPropertySchema = z.strictObject({
    type: z.literal('alarm'),
    ...propertyBaseSchema.shape,
    alarmGroups: z.array(alarmGroupSchema.shape.id),
    targetTransferPointIds: z.array(transferPointSchema.shape.id),
});

export type AlarmProperty = z.infer<typeof alarmPropertySchema>;

export const eocLogPropertySchema = z
    .strictObject({
        type: z.literal('eocLog'),
        ...propertyBaseSchema.shape,
        message: trimmedOptionalString,
        editable: z.boolean(),
        confirm: z.boolean(),
    })
    .superRefine((eocLogProperty, ctx) => {
        if (eocLogProperty.editable && !eocLogProperty.confirm) {
            ctx.addIssue({
                code: 'custom',
                message: `Einsatztagebucheintrag kann nur editierbar sein, wenn er auch bestätigt werden muss.`,
            });
        }
        if (
            !eocLogProperty.editable &&
            (eocLogProperty.message === undefined ||
                eocLogProperty.message.trim() === '')
        ) {
            ctx.addIssue({
                code: 'custom',
                message: `Einsatztagebucheintrag muss editierbar sein, wenn die Nachricht leer ist.`,
            });
        }
    });

export type EocLogProperty = z.infer<typeof eocLogPropertySchema>;

export const drawFreehandPropertySchema = z.strictObject({
    type: z.literal('drawFreehand'),
    ...propertyBaseSchema.shape,
    strokeColor: z.string(),
    fillColor: z.string(),
});

export type DrawFreehandProperty = z.infer<typeof drawFreehandPropertySchema>;

export const drawLinePropertySchema = z.strictObject({
    type: z.literal('drawLine'),
    ...propertyBaseSchema.shape,
    strokeColor: z.string(),
});

export type DrawLineProperty = z.infer<typeof drawLinePropertySchema>;

export const measurePropertySchema = z.union([
    manualConfirmPropertySchema,
    responsePropertySchema,
    delayPropertySchema,
    alarmPropertySchema,
    eocLogPropertySchema,
    drawFreehandPropertySchema,
    drawLinePropertySchema,
]);

export type MeasureProperty = z.infer<typeof measurePropertySchema>;
