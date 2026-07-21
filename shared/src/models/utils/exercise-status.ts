import { z } from 'zod';
import type { Immutable } from 'immer';

export const exerciseStatusAllowedValues = [
    'notStarted',
    'paused',
    'running',
] as const;

export const exerciseStatusSchema = z.literal(exerciseStatusAllowedValues);
export type ExerciseStatus = Immutable<z.infer<typeof exerciseStatusSchema>>;

export const exerciseTypeAllowedValues = [
    'standalone',
    'template',
    'parallel',
] as const;

export const exerciseTypeSchema = z.literal(exerciseTypeAllowedValues);
export type ExerciseType = Immutable<z.infer<typeof exerciseTypeSchema>>;

export const exerciseTypeGermanNameDictionary: {
    [K in ExerciseType]: string;
} = {
    standalone: 'Übung',
    template: 'Vorlage',
    parallel: 'Parallelübung',
} as const;
