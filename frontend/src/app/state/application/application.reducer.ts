import { createReducer, on } from '@ngrx/store';
import type { ExerciseState } from 'digital-fuesim-manv-shared';
import { reduceExerciseState, ReducerError } from 'digital-fuesim-manv-shared';
import {
    createApplyServerActionAction,
    createJoinExerciseAction,
    createJumpToTimeAction,
    createLeaveExerciseAction,
    createSetExerciseStateAction,
    createStartTimeTravelAction,
} from './application.actions';
import { ApplicationState } from './application.state';

export const applicationReducer = createReducer(
    new ApplicationState(),
    on(createSetExerciseStateAction, (state, { exercise }) => ({
        ...state,
        exerciseState: exercise,
    })),
    on(createApplyServerActionAction, (state, { serverAction }) => {
        let newExerciseState: ExerciseState | undefined;
        try {
            newExerciseState = reduceExerciseState(
                state.exerciseState!,
                serverAction
            );
        } catch (error: any) {
            if (error instanceof ReducerError) {
                console.warn(
                    `Error while applying server action: ${error.message} \n
                            This is expected if an optimistic update has been applied.`
                );
                // If the reducer throws an error (which is expected due to optimistic updates), we don't change the state
                return state;
            }
            throw error;
        }
        return {
            ...state,
            exerciseState: newExerciseState,
        };
    }),
    on(
        createStartTimeTravelAction,
        (state, { initialExerciseState, endTime }) => ({
            ...state,
            exerciseState: initialExerciseState,
            exerciseStateMode: 'timeTravel' as const,
            timeConstraints: {
                start: initialExerciseState.currentTime,
                current: initialExerciseState.currentTime,
                end: endTime,
            },
        })
    ),
    on(
        createJumpToTimeAction,
        (state, { exerciseTime, exerciseStateAtTime }) => ({
            ...state,
            exerciseState: exerciseStateAtTime,
            timeConstraints: {
                ...state.timeConstraints!,
                current: exerciseTime,
            },
        })
    ),
    on(
        createJoinExerciseAction,
        (state, { ownClientId, exerciseId, clientName, exerciseState }) => ({
            ...state,
            exerciseState,
            exerciseStateMode: 'exercise' as const,
            exerciseId,
            ownClientId,
            lastClientName: clientName,
        })
    ),
    on(createLeaveExerciseAction, (state) => ({
        ...state,
        exerciseStateMode: undefined,
    }))
);
