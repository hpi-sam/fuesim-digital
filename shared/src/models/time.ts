import { z } from 'zod';

export const exerciseTimeSchema = z.int().nonnegative();

export type ExerciseTime = z.infer<typeof exerciseTimeSchema>;
