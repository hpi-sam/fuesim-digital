import { z } from 'zod';
import type { Immutable } from 'immer';
import { transferPositionSchema } from './transfer-position.js';
import { mapPositionSchema } from './map-position.js';
import { simulatedRegionPositionSchema } from './simulated-region-position.js';
import { vehiclePositionSchema } from './vehicle-position.js';
import { noPositionSchema } from './no-position.js';

export type Position = Immutable<z.infer<typeof positionSchema>>;

export const positionSchema = z.union([
    noPositionSchema,
    mapPositionSchema,
    simulatedRegionPositionSchema,
    transferPositionSchema,
    vehiclePositionSchema,
]);
