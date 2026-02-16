import { z } from 'zod';

export const participantKeySchema = z
    .string()
    .regex(/^\d{6}$/u)
    .brand<'ParticipantKey'>();
export const groupParticipantKeySchema = z
    .string()
    .regex(/^\d{7}$/u)
    .brand<'GroupParticipantKey'>();
export const trainerKeySchema = z
    .string()
    .regex(/^\d{8}$/u)
    .brand<'TrainerKey'>();

export type GroupParticipantKey = z.infer<typeof groupParticipantKeySchema>;
export type ParticipantKey = z.infer<typeof participantKeySchema>;
export type TrainerKey = z.infer<typeof trainerKeySchema>;
// z.union doesn't work well with branded types
export type ExerciseKey = ParticipantKey | TrainerKey;
export type AccessKey = ExerciseKey | GroupParticipantKey;

export function isParticipantKey(key: string): key is ParticipantKey {
    return participantKeySchema.safeParse(key).success;
}

export function isGroupParticipantKey(key: string): key is GroupParticipantKey {
    return groupParticipantKeySchema.safeParse(key).success;
}

export function isTrainerKey(key: string): key is TrainerKey {
    return trainerKeySchema.safeParse(key).success;
}

export function isExerciseKey(key: string): key is ExerciseKey {
    return isParticipantKey(key) || isTrainerKey(key);
}

export function isAccessKey(key: string): key is AccessKey {
    return isExerciseKey(key) || isGroupParticipantKey(key);
}
