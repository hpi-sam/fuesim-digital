import { z } from 'zod';
import { maxTreatmentRange } from '../state-helpers/max-treatment-range.js';
import { uuid, type UUID, uuidSchema } from '../utils/uuid.js';
import { uuidSetSchema } from '../utils/uuid-set.js';
import type { MaterialTemplate } from './material-template.js';
import { canCaterForSchema } from './utils/cater-for.js';
import { imagePropertiesSchema } from './utils/image-properties.js';
import { type Position, positionSchema } from './utils/position/position.js';

export const materialSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('material'),
    templateId: uuidSchema,
    typeName: z.string(),
    vehicleId: uuidSchema,
    vehicleName: z.string(),
    assignedPatientIds: uuidSetSchema,
    canCaterFor: canCaterForSchema,
    /**
     * Patients in this range are preferred over patients farther away (even if they are less injured).
     * Guaranteed to be <= {@link maxTreatmentRange}.
     * Setting this to `0` means deactivating this range.
     */
    overrideTreatmentRange: z.number().min(0).max(maxTreatmentRange),
    /**
     * Only patients in this range around the material's position can be treated.
     * Guaranteed to be <= {@link maxTreatmentRange}.
     * Setting this to `0` means deactivating this range.
     */
    treatmentRange: z.number().min(0).max(maxTreatmentRange),
    position: positionSchema,

    image: imagePropertiesSchema,
});
export type Material = z.infer<typeof materialSchema>;

export function newMaterialFromTemplate(
    materialTemplate: MaterialTemplate,
    vehicleId: UUID,
    vehicleName: string,
    position: Position,
    id?: UUID
): Material {
    return {
        id: id ?? uuid(),
        type: 'material',
        templateId: materialTemplate.id,
        typeName: materialTemplate.name,
        vehicleId,
        vehicleName,
        assignedPatientIds: {},
        image: materialTemplate.image,
        canCaterFor: materialTemplate.canCaterFor,
        overrideTreatmentRange: materialTemplate.overrideTreatmentRange,
        treatmentRange: materialTemplate.treatmentRange,
        position,
    };
}
