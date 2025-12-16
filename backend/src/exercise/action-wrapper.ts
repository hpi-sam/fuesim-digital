import type { ExerciseAction, UUID } from 'digital-fuesim-manv-shared';
import type { ActionEntry } from '../database/schema.js';
import type { ActiveExercise } from './exercise-wrapper.js';

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
        id?: UUID
    ) {
        this.action = {
            actionString: action,
            emitterId,
            index: index ?? exercise.incrementIdGenerator.next(),
            id: id ?? undefined,
        };
    }
}
