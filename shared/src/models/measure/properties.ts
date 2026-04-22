import { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';

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
    manualConfirm: 'Bitte bestätigen Sie die Maßnahme',
    response: 'Jetzt Antwort bestätigen',
    delay: 'Bitte warten Sie',
    alarm: 'Jetzt Alarmgruppe und Transferpunkt auswählen',
    eocLog: 'Jetzt Einsatztagebucheintrag erstellen',
    drawFreehand: 'Jetzt frei Bereich einzeichnen (gedrückt halten)',
    drawLine:
        'Jetzt eine Linie einzeichnen (einfacher Klick um neuen Punkt zu setzen, doppelter Klick für Schlusspunkt)',
};

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

// ==================================================
export const propertyBaseSchema = z.strictObject({
    hint: z.string(),
});

export const manualConfirmPropertySchema = z.strictObject({
    type: z.literal('manualConfirm'),
    ...propertyBaseSchema.shape,
    prompt: z.string().min(1, {
        error: 'Der Bestätigungstext kann nicht leer sein.',
    }),
    confirmationString: z.string().optional(),
});

export type ManualConfirmProperty = z.infer<typeof manualConfirmPropertySchema>;

export const responsePropertySchema = z.strictObject({
    type: z.literal('response'),
    ...propertyBaseSchema.shape,
    response: z.string().min(1, {
        error: 'Die Rückmeldung kann nicht leer sein',
    }),
});

export type ResponseProperty = z.infer<typeof responsePropertySchema>;

export const delayPropertySchema = z.strictObject({
    type: z.literal('delay'),
    ...propertyBaseSchema.shape,
    delay: z
        .number({ error: 'Die Dauer der Verzögerung muss eine Zahl sein' })
        .positive({ error: 'Die Dauer der Verzögerung muss positiv sein' }),
});

export type DelayProperty = z.infer<typeof delayPropertySchema>;

export const alarmPropertySchema = z.strictObject({
    type: z.literal('alarm'),
    ...propertyBaseSchema.shape,
    alarmGroups: z.array(uuidSchema),
    targetTransferPointIds: z.array(uuidSchema),
});

export type AlarmProperty = z.infer<typeof alarmPropertySchema>;

export const eocLogPropertySchema = z
    .strictObject({
        type: z.literal('eocLog'),
        ...propertyBaseSchema.shape,
        message: z.string().optional(),
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

// ==================================================

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
