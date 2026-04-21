import type { ExerciseState } from '../state.js';
import type { ExerciseAction } from '../store/action-reducers/action-reducers.js';
import type { UUID } from './uuid.js';

export interface ExerciseTimeline {
    readonly initialState: ExerciseState;
    readonly actionsWrappers: readonly {
        readonly action: ExerciseAction;
        /**
         * This value is `null` iff the action was proposed by the server, otherwise it's the id of the proposing client in the state at that time.
         */
        readonly emitterId: UUID | null;
        readonly time: number;
    }[];
}
