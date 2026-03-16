import { createAction } from '@ngrx/store';
import type {
    ExerciseAction,
    ExerciseKey,
    ExerciseState,
    UUID,
} from 'fuesim-digital-shared';

export const createStartTimeTravelAction = createAction(
    '[Application] Start time travel',
    (initialExerciseState: ExerciseState, endTime: number) => ({
        initialExerciseState,
        endTime,
    })
);

export const createJumpToTimeAction = createAction(
    '[Application] Jump to time',
    (exerciseTime: number, exerciseStateAtTime: ExerciseState) => ({
        exerciseTime,
        exerciseStateAtTime,
    })
);

export const createJoinExerciseAction = createAction(
    '[Application] Join exercise',
    (
        ownClientId: UUID,
        exerciseState: ExerciseState,
        exerciseKey: ExerciseKey,
        clientName: string
    ) => ({
        ownClientId,
        exerciseState,
        exerciseKey,
        clientName,
    })
);

export const createLeaveExerciseAction = createAction(
    '[Application] Leave exercise'
);

// The actions for the ExerciseService
/**
 * Applies the given action from the server to the exercise state in the frontend.
 */
export const createApplyServerActionAction = createAction(
    '[Exercise] Apply server action',
    (serverAction: ExerciseAction) => ({ serverAction })
);
export const createSetExerciseStateAction = createAction(
    '[Exercise] Set state',
    (exercise: ExerciseState) => ({ exercise })
);
