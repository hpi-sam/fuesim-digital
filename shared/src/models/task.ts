import { z } from 'zod';
import { uuidSchema } from '../utils/uuid.js';

export const taskSchema = z.object({
    id: uuidSchema,
    type: z.literal('task'),
    taskName: z.string(),
});

export type Task = z.infer<typeof taskSchema>;
