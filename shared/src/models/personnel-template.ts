import { z } from 'zod';
import type { Immutable } from 'immer';
import { maxTreatmentRange } from '../state-helpers/max-treatment-range.js';
import { uuid, uuidSchema } from '../utils/uuid.js';
import { versionedElementModelSchema } from '../marketplace/models/versioned-element-model.js';
import { validationMessages } from '../validation-messages.js';
import { type CanCaterFor, canCaterForSchema } from './utils/cater-for.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from './utils/image-properties.js';

export const personnelTemplateSchema = z.strictObject({
    ...versionedElementModelSchema.shape,
    id: uuidSchema,
    type: z.literal('personnelTemplate'),
    personnelType: z.string().trim().nonempty(validationMessages.required),
    name: z.string().trim().nonempty(validationMessages.required),
    abbreviation: z.string().trim().nonempty(validationMessages.required),
    canCaterFor: canCaterForSchema,
    /**
     * Patients in this range are preferred over patients farther away (even if they are less injured).
     * Guaranteed to be <= {@link maxTreatmentRange}.
     */
    overrideTreatmentRange: z
        .number()
        .nonnegative(validationMessages.notNonNegative)
        .max(maxTreatmentRange),
    /**
     * Only patients in this range around the personnel's position can be treated.
     * Guaranteed to be <= {@link maxTreatmentRange}.
     */
    treatmentRange: z
        .number()
        .nonnegative(validationMessages.notNonNegative)
        .max(maxTreatmentRange),
    image: imagePropertiesSchema,
});

export type PersonnelTemplate = Immutable<
    z.infer<typeof personnelTemplateSchema>
>;

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
