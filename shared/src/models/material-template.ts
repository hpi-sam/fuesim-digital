import { z } from 'zod';
import { maxTreatmentRange } from '../state-helpers/max-treatment-range.js';
import { uuid } from '../utils/index.js';
import type { CanCaterFor, ImageProperties } from './utils/index.js';
import { imagePropertiesSchema } from './utils/index.js';
import { canCaterForSchema } from './utils/cater-for.js';

export const materialTemplateSchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('materialTemplate'),
    name: z.string(),
    canCaterFor: canCaterForSchema,
    /**
     * Patients in this range are preferred over patients farther away (even if they are less injured).
     * Guaranteed to be <= {@link maxTreatmentRange}.
     */
    overrideTreatmentRange: z.number().min(0).max(maxTreatmentRange),
    /**
     * Only patients in this range around the material's position can be treated.
     * Guaranteed to be <= {@link maxTreatmentRange}.
     */
    treatmentRange: z.number().min(0).max(maxTreatmentRange),
    image: imagePropertiesSchema,
});
export type MaterialTemplate = z.infer<typeof materialTemplateSchema>;

export function newMaterialTemplate(
    name: string,
    image: ImageProperties,
    canCaterFor: CanCaterFor,
    overrideTreatmentRange: number,
    treatmentRange: number
): MaterialTemplate {
    return {
        id: uuid(),
        type: 'materialTemplate',
        name,
        image,
        canCaterFor,
        overrideTreatmentRange,
        treatmentRange,
    };
}
