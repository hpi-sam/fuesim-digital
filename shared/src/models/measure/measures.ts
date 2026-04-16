import { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';
import {
    measurePropertyDefinitions,
    measurePropertySchema,
    measurePropertyTypeToGermanNameDictionary,
} from './properties.js';

export const measureTemplateSchema = z.strictObject({
    id: uuidSchema,
    name: z
        .string()
        .min(1, { error: 'Der Name muss mindestens 1 Zeichen lang sein' }),
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
                            message: `"${measurePropertyTypeToGermanNameDictionary[property.type]}" benötigt mindestens eine der folgenden Eigenschaften: ${names}`,
                        });
                    }
                }

                for (const blocker of def.blockedBy) {
                    console.error(blocker, def.blockedBy);
                    if (presentTypes.has(blocker)) {
                        ctx.addIssue({
                            code: 'custom',
                            message: `"${measurePropertyTypeToGermanNameDictionary[property.type]}" kann nicht mit "${measurePropertyTypeToGermanNameDictionary[blocker]}" kombiniert werden`,
                        });
                    }
                }
            }
        })
        .min(1, { error: 'Eine Maßnahme braucht mindestens eine Eigenschaft' }),
});

export type MeasureTemplate = z.infer<typeof measureTemplateSchema>;

export const measureTemplateCategorySchema = z.strictObject({
    name: z.string().min(1),
    templates: z.record(uuidSchema, measureTemplateSchema),
});

export type MeasureTemplateCategory = z.infer<
    typeof measureTemplateCategorySchema
>;

export const measureSchema = z.strictObject({
    id: uuidSchema,
    timestamp: z.number(),
    clientName: z.string(),
    template: uuidSchema,
});

export type Measure = z.infer<typeof measureSchema>;
