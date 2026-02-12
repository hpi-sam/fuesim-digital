import { z } from 'zod';
import { maxTreatmentRange } from '../state-helpers/max-treatment-range.js';
import type { UUID } from '../utils/index.js';
import { uuidSetSchema, uuid } from '../utils/index.js';
import type { PersonnelTemplate } from './personnel-template.js';
import {
    imagePropertiesSchema,
    type Position,
    positionSchema,
} from './utils/index.js';
import { canCaterForSchema } from './utils/cater-for.js';

export const personnelSchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('personnel'),
    vehicleId: z.uuidv4(),
    vehicleName: z.string(),
    /**
     * @deprecated This will be refactored into a capability-based system. Please already consider using {@link templateId} if you only need an opaque identifier of the type and you don't assert any properties of the personnel.
     */
    personnelType: z.string(),
    templateId: z.uuidv4(),
    typeName: z.string(),
    typeAbbreviation: z.string(),
    assignedPatientIds: uuidSetSchema,

    canCaterFor: canCaterForSchema,
    /**
     * Patients in this range are preferred over patients that are more far away (even if they are less injured).
     * Guaranteed to be <= {@link maxTreatmentRange}.
     * Setting this to `0` means deactivating this range.
     */
    overrideTreatmentRange: z.number().min(0).max(maxTreatmentRange),
    /**
     * Only patients in this range around the personnel's position can be treated.
     * Guaranteed to be <= {@link maxTreatmentRange}.
     * Setting this to `0` means deactivating this range.
     */
    treatmentRange: z.number().min(0).max(maxTreatmentRange),
    image: imagePropertiesSchema,
    position: positionSchema,
});

export type Personnel = z.infer<typeof personnelSchema>;

export function newPersonnelFromTemplate(
    personnelTemplate: PersonnelTemplate,
    vehicleId: UUID,
    vehicleName: string,
    position: Position
): Personnel {
    return {
        id: uuid(),
        type: 'personnel',
        vehicleId,
        vehicleName,
        personnelType: personnelTemplate.personnelType,
        templateId: personnelTemplate.id,
        typeName: personnelTemplate.name,
        typeAbbreviation: personnelTemplate.abbreviation,
        assignedPatientIds: {},
        image: personnelTemplate.image,
        canCaterFor: personnelTemplate.canCaterFor,
        treatmentRange: personnelTemplate.treatmentRange,
        overrideTreatmentRange: personnelTemplate.overrideTreatmentRange,
        position,
    };
}
