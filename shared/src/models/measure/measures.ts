import { z } from 'zod';
import type { UUID } from '../../utils/uuid.js';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import { validationMessages } from '../../validation-messages.js';
import type { MeasureProperty } from './properties.js';
import {
    measurePropertyDefinitions,
    measurePropertySchema,
    measurePropertyTypeToGermanNameDictionary,
} from './properties.js';
import type { MeasurePropertyInstance } from './instances.js';
import { measurePropertyInstanceSchema } from './instances.js';

export const measureTemplateSchema = z.strictObject({
    type: z.literal('measureTemplate'),
    id: uuidSchema,
    name: z.string().nonempty({ error: validationMessages.required }),
    properties: z
        .array(measurePropertySchema)
        .superRefine((properties, ctx) => {
            const presentTypes = new Set(properties.map((p) => p.type));

            for (const property of properties) {
                const def = measurePropertyDefinitions[property.type];

                for (const requirement of def.requires) {
                    if (!requirement.anyOf.some((t) => presentTypes.has(t))) {
                        const names = requirement.anyOf
                            .map(
                                (t) =>
                                    measurePropertyTypeToGermanNameDictionary[t]
                            )
                            .join(', ');
                        ctx.addIssue({
                            code: 'custom',
                            message: `"${measurePropertyTypeToGermanNameDictionary[property.type]}" benötigt mindestens einen der folgenden Schritte: ${names}`,
                        });
                    }
                }

                for (const blocker of def.blockedBy) {
                    if (presentTypes.has(blocker)) {
                        ctx.addIssue({
                            code: 'custom',
                            message: `"${measurePropertyTypeToGermanNameDictionary[property.type]}" kann nicht mit "${measurePropertyTypeToGermanNameDictionary[blocker]}" kombiniert werden`,
                        });
                    }
                }
            }
        })
        .min(1, { error: 'Eine Maßnahme braucht mindestens einen Schritt.' }),
    replacePrevious: z.boolean(),
});

export type MeasureTemplate = z.infer<typeof measureTemplateSchema>;

export function newMeasureTemplate(
    name: string,
    properties: MeasureProperty[],
    replacePrevious: boolean
): MeasureTemplate {
    return measureTemplateSchema.parse({
        type: 'measureTemplate',
        id: uuid(),
        name,
        properties,
        replacePrevious,
    });
}

export const measureTemplateCategorySchema = z.strictObject({
    type: z.literal('measureTemplateCategory'),
    name: z.string().nonempty({ error: validationMessages.required }),
    templates: z.record(measureTemplateSchema.shape.id, measureTemplateSchema),
});

export type MeasureTemplateCategory = z.infer<
    typeof measureTemplateCategorySchema
>;

export function newMeasureTemplateCategory(
    name: string,
    templates: MeasureTemplate[]
): MeasureTemplateCategory {
    return measureTemplateCategorySchema.parse({
        type: 'measureTemplateCategory',
        name,
        templates: Object.fromEntries(templates.map((t) => [t.id, t])),
    });
}

export const measureSchema = z.strictObject({
    type: z.literal('measure'),
    id: uuidSchema,
    timestamp: z.number(),
    clientName: z.string(),
    templateId: measureTemplateSchema.shape.id,
    instances: z.array(measurePropertyInstanceSchema),
});

export type Measure = z.infer<typeof measureSchema>;

export function newMeasure(
    timestamp: number,
    clientName: string,
    templateId: UUID,
    instances: MeasurePropertyInstance[]
): Measure {
    return measureSchema.parse({
        type: 'measure',
        id: uuid(),
        timestamp,
        clientName,
        templateId,
        instances,
    });
}
