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
    transferPointSchema,
    vehicleSchema,
    viewportSchema,
    scoutableSchema,
]);
export type Element = z.infer<typeof elementSchema>;
