import * as z from 'zod';
import { IsZodSchema } from '../../../utils/validators/is-zod-object.js';
import { transferPositionSchema } from './transfer-position.js';
import { mapPositionSchema } from './map-position.js';
import { simulatedRegionPositionSchema } from './simulated-region-position.js';
import { vehiclePositionSchema } from './vehicle-position.js';

export type Position = z.infer<typeof positionSchema>;

export const positionSchema = z.union([
    mapPositionSchema,
    simulatedRegionPositionSchema,
    transferPositionSchema,
    vehiclePositionSchema,
]);

// eslint-disable-next-line @typescript-eslint/naming-convention
export const IsPosition = () => IsZodSchema(positionSchema);
