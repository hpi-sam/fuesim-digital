import type {
    ExerciseKey,
    ParticipantKey,
    TrainerKey,
} from 'digital-fuesim-manv-shared';
import {
    participantKeySchema,
    trainerKeySchema,
} from 'digital-fuesim-manv-shared';

export function isParticipantKey(key: string): key is ParticipantKey {
    return participantKeySchema.safeParse(key).success;
}

export function isTrainerKey(key: string): key is TrainerKey {
    return trainerKeySchema.safeParse(key).success;
}

export function isExerciseKey(key: string): key is ExerciseKey {
    return isParticipantKey(key) || isTrainerKey(key);
}
