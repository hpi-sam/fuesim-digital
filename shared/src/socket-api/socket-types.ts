import type { ExerciseState } from '../state.js';
import type { ExerciseAction } from '../store/index.js';
import type {
    JoinExerciseResponseDataInput,
    JoinParallelExerciseResponseData,
    UpdateParallelExerciseResponseData,
} from '../http-interfaces.js';
import type { UUID } from '../utils/index.js';
import type { ExerciseKey } from '../exercise-keys.js';

export interface ServerToClientEvents {
    performAction: (action: ExerciseAction) => void;
    updateExerciseInstances: (data: UpdateParallelExerciseResponseData) => void;
}

// The last argument is always expected to be the callback function. (To be able to use it in advanced typings)
export interface ClientToServerEvents {
    joinExercise: (
        exerciseKey: ExerciseKey,
        clientName: string,
        callback: (
            response: SocketResponse<JoinExerciseResponseDataInput>
        ) => void
    ) => void;
    proposeAction: (
        action: ExerciseAction,
        callback: (response: SocketResponse) => void
    ) => void;
    getState: (
        callback: (response: SocketResponse<ExerciseState>) => void
    ) => void;
    joinParallelExercise: (
        id: UUID,
        callback: (
            response: SocketResponse<JoinParallelExerciseResponseData>
        ) => void
    ) => void;
    controlParallelExercise: (
        action: 'pause' | 'start',
        callback: (response: SocketResponse) => void
    ) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InterServerEvents {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SocketData {}

export type SocketResponse<T = undefined> =
    | (T extends undefined
          ? {
                readonly success: true;
            }
          : {
                readonly success: true;
                readonly payload: T;
            })
    | {
          readonly success: false;
          readonly message: string;
          readonly expected: boolean;
      };
