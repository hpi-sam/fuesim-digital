import * as z from 'zod';
import { uuidSchema } from '../../utils/index.js';
import { startPointSchema } from './start-points.js';

export const transferSchema = z.strictObject({
    endTimeStamp: z.number(),
    startPoint: startPointSchema,
    targetTransferPointId: uuidSchema,
    isPaused: z.boolean(),
});

export type Transfer = z.infer<typeof transferSchema>;
