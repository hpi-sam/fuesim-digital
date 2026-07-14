import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../../utils/uuid.js';
import { startPointSchema } from './start-points.js';

export const transferSchema = z.strictObject({
    endTimeStamp: z.number(),
    startPoint: startPointSchema,
    targetTransferPointId: uuidSchema,
    isPaused: z.boolean(),
});

export type Transfer = Immutable<z.infer<typeof transferSchema>>;
