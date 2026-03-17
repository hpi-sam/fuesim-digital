import type { Immutable } from 'immer';
import * as z from 'zod';
import type { UUID, UUIDSet } from '../utils/index.js';
import { uuidSchema, uuid, uuidSetSchema } from '../utils/index.js';
import {
    exerciseOccupationSchema,
    imagePropertiesSchema,
    positionSchema,
} from './utils/index.js';
import type {
    Position,
    ImageProperties,
    ExerciseOccupation,
} from './utils/index.js';

export const vehicleSchema = z.strictObject({
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
    };
}
