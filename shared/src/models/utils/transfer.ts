import * as z from 'zod';
import { startPointSchema } from './start-points.js';

export const transferSchema = z.strictObject({
    endTimeStamp: z.number(),
    startPoint: startPointSchema,
    targetTransferPointId: z.uuidv4(),
    isPaused: z.boolean(),
});

export type Transfer = z.infer<typeof transferSchema>;
