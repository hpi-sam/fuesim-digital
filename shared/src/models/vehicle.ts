import type { Immutable } from 'immer';
import { z } from 'zod';
import { uuid, type UUID, uuidSchema } from '../utils/uuid.js';
import { type UUIDSet, uuidSetSchema } from '../utils/uuid-set.js';
import { type Position, positionSchema } from './utils/position/position.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from './utils/image-properties.js';
import {
    type ExerciseOccupation,
    exerciseOccupationSchema,
} from './utils/occupations/exercise-occupation.js';
import { operationalAssignmentSchema } from './operational-section.js';
import { versionedElementPartialSchema } from './index.js';
import { versionedElementModel } from './versioned-element-model.js';

export const vehicleSchema = z.strictObject({
    ...versionedElementModel.partial().shape,
    id: uuidSchema,
    type: z.literal('vehicle'),
    vehicleType: z.string(),
    name: z.string(),
    templateId: uuidSchema,
    materialIds: uuidSetSchema,
    patientCapacity: z.int().nonnegative(),
    position: positionSchema,
    image: imagePropertiesSchema,
    personnelIds: uuidSetSchema,
    patientIds: uuidSetSchema,
    occupation: exerciseOccupationSchema,
    operationalAssignment: operationalAssignmentSchema.nullable(),
});

export type Vehicle = Immutable<z.infer<typeof vehicleSchema>>;

export function newVehicle(
    vehicleType: string,
    name: string,
    templateId: UUID,
    materialIds: UUIDSet,
    patientCapacity: number,
    image: ImageProperties,
    position: Position,
    occupation: ExerciseOccupation
): Vehicle {
    return {
        id: uuid(),
        type: 'vehicle',
        vehicleType,
        name,
        templateId,
        materialIds,
        patientCapacity,
        position,
        image,
        personnelIds: {},
        patientIds: {},
        occupation,
        operationalAssignment: null,
    };
}
