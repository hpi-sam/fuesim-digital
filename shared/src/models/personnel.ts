import { z } from 'zod';
import { maxTreatmentRange } from '../state-helpers/max-treatment-range.js';
import { uuid, type UUID, uuidSchema } from '../utils/uuid.js';
import { uuidSetSchema } from '../utils/uuid-set.js';
import { versionedElementModelSchema } from '../marketplace/models/versioned-element-model.js';
import { hybridIdSchema } from '../utils/hybrid-id.js';
import type { PersonnelTemplate } from './personnel-template.js';
import { canCaterForSchema } from './utils/cater-for.js';
import { imagePropertiesSchema } from './utils/image-properties.js';
import { type Position, positionSchema } from './utils/position/position.js';
import { registerEditableValue } from './utils/editable-values-registry.js';

export const personnelSchema = z.strictObject({
    ...versionedElementModelSchema.partial().shape,
    id: uuidSchema,
    type: z.literal('personnel'),
    vehicleId: uuidSchema,
    vehicleName: z.string(),
    /**
     * @deprecated This will be refactored into a capability-based system. Please already consider using {@link templateId} if you only need an opaque identifier of the type and you don't assert any properties of the personnel.
     */
    personnelType: z.string(),
    templateId: hybridIdSchema,
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
    position: Position,
    id?: UUID
): Personnel {
    return {
        id: id ?? uuid(),
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

registerEditableValue({ model: 'personnel', template: 'personnelTemplate' }, [
    {
        id: 'model',
        name: 'Modell',
        asString: () => {
            throw new Error('Not supported');
        },
        equality: () => {
            throw new Error('Not supported');
        },
        keep: () => {
            throw new Error('Not supported');
        },
        replace: () => {
            throw new Error('Not supported');
        },
    },
]);
