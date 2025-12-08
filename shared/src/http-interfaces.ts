export interface ExerciseKeys {
    readonly participantKey: string;
    readonly trainerKey: string;
}

export interface ExerciseAccessIds {
    readonly participantId: string;
    readonly trainerId: string;
}

export interface Exercise extends ExerciseIds {
    readonly lastUsedAt: string;
}

export type ExerciseList = Exercise[];
