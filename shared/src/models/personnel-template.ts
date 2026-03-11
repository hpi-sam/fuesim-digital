import { z } from 'zod';
import { maxTreatmentRange } from '../state-helpers/max-treatment-range.js';
import { uuid, uuidSchema } from '../utils/index.js';
import {
    type CanCaterFor,
    imagePropertiesSchema,
    type ImageProperties,
} from './utils/index.js';
import { canCaterForSchema } from './utils/cater-for.js';

export const personnelTemplateSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('personnelTemplate'),
    personnelType: z.string(),
    name: z.string(),
    abbreviation: z.string(),
    canCaterFor: canCaterForSchema,
    /**
     * Patients in this range are preferred over patients farther away (even if they are less injured).
     * Guaranteed to be <= {@link maxTreatmentRange}.
     */
    overrideTreatmentRange: z.number().min(0).max(maxTreatmentRange),
    /**
     * Only patients in this range around the personnel's position can be treated.
     * Guaranteed to be <= {@link maxTreatmentRange}.
     */
    treatmentRange: z.number().min(0).max(maxTreatmentRange),
    image: imagePropertiesSchema,
});

export type PersonnelTemplate = z.infer<typeof personnelTemplateSchema>;

export function newPersonnelTemplate(
    personnelType: string,
    name: string,
    abbreviation: string,
    canCaterFor: CanCaterFor,
    overrideTreatmentRange: number,
    treatmentRange: number,
    image: ImageProperties
): PersonnelTemplate {
    return {
        id: uuid(),
        type: 'personnelTemplate',
        personnelType,
        name,
        abbreviation,
        canCaterFor,
        overrideTreatmentRange,
        treatmentRange,
        image,
    };
}
