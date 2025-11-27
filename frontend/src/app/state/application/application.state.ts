import type { ExerciseState, UUID } from 'digital-fuesim-manv-shared';
import type { TimeConstraints } from 'src/app/core/time-travel-helper';

export class ApplicationState {
    /**
     * The state of the exercise with {@link exerciseId}
     */
    public readonly exerciseState: ExerciseState | undefined = undefined;

    /**
     * Depending on the mode the {@link exerciseState} is
     * exercise: (always) up-to-date
     * timeTravel: at an arbitrary time, probably in the past
     * undefined: no assumptions can be made over the exerciseState (e.g. on the landing page)
     */
    public readonly exerciseStateMode: 'exercise' | 'timeTravel' | undefined =
        undefined;
    /**
     * Either the trainer or participant id of the current or last exercise the client had joined
     * undefined if the client hasn't joined an exercise yet
     */
    public readonly exerciseId: string | undefined = undefined;

    /**
     * The timeConstraints for the current or last timeTravel
     * undefined if the client hasn't time traveled yet
     */
    public readonly timeConstraints: TimeConstraints | undefined = undefined;

    /**
     * The current or last id of the client that is or was joined to {@link exerciseId}
     * undefined if the client hasn't joined an exercise yet
     */
    public readonly ownClientId: UUID | undefined = undefined;

    /**
     * The last name this client had, when he joined an exercise
     * undefined if the client hasn't joined an exercise yet
     */
    public readonly lastClientName: string | undefined = undefined;
}
