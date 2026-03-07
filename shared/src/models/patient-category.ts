import { z } from 'zod';
import type { PatientTemplate } from './patient-template.js';
import { patientTemplateSchema } from './patient-template.js';
import type { ImageProperties } from './utils/index.js';
import {
    patientStatusCodeSchema,
    imagePropertiesSchema,
    newPatientStatusCode,
} from './utils/index.js';

export const patientCategorySchema = z.strictObject({
    type: z.literal('patientCategory'),
    name: patientStatusCodeSchema,
    image: imagePropertiesSchema,
    patientTemplates: z.array(patientTemplateSchema).nonempty(),
});
export type PatientCategory = z.infer<typeof patientCategorySchema>;

export function newPatientCategory(
    name: string,
    image: ImageProperties,
    patientTemplates: PatientTemplate[]
): PatientCategory {
    return {
        type: 'patientCategory',
        name: newPatientStatusCode(name),
        image,
        patientTemplates,
    };
}
