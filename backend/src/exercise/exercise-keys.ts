import { z } from 'zod';

const participantKeySchema = z
    .string()
    .min(6)
    .max(6)
    .regex(/^\d{6}$/u)
    .brand<'ParticipantKey'>();
const trainerKeySchema = z
    .string()
    .min(8)
    .max(8)
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
