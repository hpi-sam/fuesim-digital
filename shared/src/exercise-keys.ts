import { z } from 'zod';

export const participantKeySchema = z
    .string()
    .regex(/^\d{6}$/u)
    .brand<'ParticipantKey'>();
export const trainerKeySchema = z
    .string()
    .regex(/^\d{8}$/u)
    .brand<'TrainerKey'>();

export type ParticipantKey = z.infer<typeof participantKeySchema>;
export type TrainerKey = z.infer<typeof trainerKeySchema>;
// z.union doesn't work well with branded types
export type ExerciseKey = ParticipantKey | TrainerKey;

export function isParticipantKey(key: string): key is ParticipantKey {
    return participantKeySchema.safeParse(key).success;
}

export function isTrainerKey(key: string): key is TrainerKey {
    return trainerKeySchema.safeParse(key).success;
}

export function isExerciseKey(key: string): key is ExerciseKey {
    return isParticipantKey(key) || isTrainerKey(key);
}
