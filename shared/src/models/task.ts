import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../utils/uuid.js';

export const taskSchema = z.object({
    id: uuidSchema,
    type: z.literal('task'),
    taskName: z.string(),
});

export type Task = Immutable<z.infer<typeof taskSchema>>;
