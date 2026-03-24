import { z } from 'zod';

export const taskSchema = z.object({
    id: z.uuidv4(),
    type: z.literal('task'),
    taskName: z.string(),
});

export type Task = z.infer<typeof taskSchema>;
