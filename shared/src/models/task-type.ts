import { z } from 'zod';
import { uuidSchema } from '../utils/uuid.js';

export const taskTypeSchema = z.object({
    id: uuidSchema.brand<'TaskTypeId'>(),
    type: z.literal('taskType'),
    taskName: z.string(),
});

export type TaskType = z.infer<typeof taskTypeSchema>;
