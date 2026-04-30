import { z } from 'zod';
import { alarmGroupSchema } from './alarm-group.js';
import { clientSchema } from './client.js';
import { hospitalSchema } from './hospital.js';
import { mapImageSchema } from './map-image.js';
import { materialSchema } from './material.js';
import { patientSchema } from './patient.js';
import { personnelSchema } from './personnel.js';
import { restrictedZoneSchema } from './restricted-zone.js';
import { simulatedRegionSchema } from './simulated-region.js';
import { transferPointSchema } from './transfer-point.js';
import { vehicleSchema } from './vehicle.js';
import { viewportSchema } from './viewport.js';
import { scoutableSchema } from './scoutable.js';
import { technicalChallengeSchema } from './technical-challenge/technical-challenge.js';
import { taskSchema } from './task.js';

export const elementSchema = z.discriminatedUnion('type', [
    alarmGroupSchema,
    clientSchema,
    hospitalSchema,
    mapImageSchema,
    materialSchema,
    patientSchema,
    personnelSchema,
    restrictedZoneSchema,
    simulatedRegionSchema,
    taskSchema,
    technicalChallengeSchema,
    transferPointSchema,
    vehicleSchema,
    viewportSchema,
    scoutableSchema,
]);
export type Element = z.infer<typeof elementSchema>;

export const elementTypeSchema = z.union(
    elementSchema.options.map((option) => z.literal(option.shape.type.value))
);

export type ElementType = z.infer<typeof elementTypeSchema>;
