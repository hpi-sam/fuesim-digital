import type { ActionId, ExerciseAction, UUID } from 'fuesim-digital-shared';
import type { ActionEntry } from '../database/schema.js';
import type { ActiveExercise } from './active-exercise.js';

export class ActionWrapper {
    private readonly action: Omit<ActionEntry, 'exerciseId' | 'id'> &
        Partial<Pick<ActionEntry, 'id'>>;

    public getAction() {
        return this.action;
    }

    public get isInDatabase() {
        return this.action.id !== undefined;
    }

    /**
     * @param emitterId `null` iff the emitter was the server, the client id otherwise
     */
    public constructor(
        action: ExerciseAction,
        emitterId: UUID | null,
        public readonly exercise: ActiveExercise,
        index?: number,
        id?: ActionId
    ) {
        this.action = {
            actionString: action,
            emitterId,
            index: index ?? exercise.incrementIdGenerator.next(),
            id: id ?? undefined,
        };
    }
}
