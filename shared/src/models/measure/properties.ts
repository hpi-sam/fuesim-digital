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

const requiresAnyOfSchema = z.strictObject({
    anyOf: z.array(measurePropertyTypeSchema),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const measurePropertyDefinitionSchema = z.strictObject({
    blockedBy: z.array(measurePropertyTypeSchema),
    requires: z.array(requiresAnyOfSchema),
});

type MeasurePropertyDefinition = z.infer<
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

const propertyBaseSchema = z.strictObject({
    hint: z.string(),
});

const manualConfirmPropertySchema = z.strictObject({
    ...propertyBaseSchema.shape,
    type: z.literal('manualConfirm'),
    prompt: z.string().nonempty({
        error: validationMessages.required,
    }),
    confirmationString: trimmedOptionalString,
});

const responsePropertySchema = z.strictObject({
    ...propertyBaseSchema.shape,
    type: z.literal('response'),
    response: z.string().nonempty({ error: validationMessages.required }),
});

const delayPropertySchema = z.strictObject({
    ...propertyBaseSchema.shape,
    type: z.literal('delay'),
    delay: z
        .int({ error: 'Die Dauer der Verzögerung muss eine Zahl sein' })
        .positive({ error: 'Die Dauer der Verzögerung muss positiv sein' }),
});

const alarmPropertySchema = z.strictObject({
    ...propertyBaseSchema.shape,
    type: z.literal('alarm'),
    alarmGroups: z.array(alarmGroupSchema.shape.id),
    targetTransferPointIds: z.array(transferPointSchema.shape.id),
});

const eocLogPropertySchema = z
    .strictObject({
        ...propertyBaseSchema.shape,
        type: z.literal('eocLog'),
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

const drawFreehandPropertySchema = z.strictObject({
    ...propertyBaseSchema.shape,
    type: z.literal('drawFreehand'),
    strokeColor: z.string(),
    fillColor: z.string(),
});

const drawLinePropertySchema = z.strictObject({
    ...propertyBaseSchema.shape,
    type: z.literal('drawLine'),
    strokeColor: z.string(),
});

export const measurePropertySchema = z.discriminatedUnion('type', [
    manualConfirmPropertySchema,
    responsePropertySchema,
    delayPropertySchema,
    alarmPropertySchema,
    eocLogPropertySchema,
    drawFreehandPropertySchema,
    drawLinePropertySchema,
]);

export type MeasureProperty = z.infer<typeof measurePropertySchema>;
