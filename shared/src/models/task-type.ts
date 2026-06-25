import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../utils/uuid.js';

export const taskTypeSchema = z.object({
    id: uuidSchema.brand<'TaskTypeId'>(),
    type: z.literal('taskType'),
    taskName: z.string(),
});

export type TaskType = Immutable<z.infer<typeof taskTypeSchema>>;
