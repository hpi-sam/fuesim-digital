import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../utils/uuid.js';

export const taskTypeSchema = z.object({
    id: uuidSchema.brand<'TaskTypeId'>(),
    type: z.literal('taskType'),
    taskName: z.string(),
});

export type TaskType = Immutable<z.infer<typeof taskTypeSchema>>;

export const taskTimeSpentSchema = z.strictObject({
    timeSpent: z.int().nonnegative(),
    lastUpdatedAt: z.int().nonnegative(),
});

export type TaskTimeSpent = z.infer<typeof taskTimeSpentSchema>;

export function newTaskTimeSpent(): TaskTimeSpent {
    return {
        timeSpent: 0,
        lastUpdatedAt: 0,
    };
}
