import { z } from 'zod';
import { uuidSchema } from '../utils/uuid.js';

export const taskSchema = z.object({
    id: uuidSchema,
    type: z.literal('task'),
    taskName: z.string(),
});

export type Task = z.infer<typeof taskSchema>;

export const taskProgressSchema = z.strictObject({
    progress: z.int().nonnegative(),
    lastUpdatedAt: z.int().nonnegative(),
});

export type TaskProgress = z.infer<typeof taskProgressSchema>;

export function newTaskProgress(): TaskProgress {
    return {
        progress: 0,
        lastUpdatedAt: 0,
    };
}
