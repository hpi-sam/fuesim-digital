import type { ExerciseAction, UUID } from 'digital-fuesim-manv-shared';
import { Client, ClientRole } from 'digital-fuesim-manv-shared';
import type { ExerciseSocket } from '../exercise-server.js';
import { exerciseMap } from './exercise-map.js';
import type { ExerciseWrapper } from './exercise-wrapper.js';

export class ClientWrapper {
    public constructor(private readonly socket: ExerciseSocket) {}

    private chosenExercise?: ExerciseWrapper;

    private relatedExerciseClient?: Client;

    /**
     * @param exerciseId The exercise id to be used for the client.
     * @param clientName The public name of the client.
     * @returns The joined client's id, or undefined when the exercise doesn't exists.
     */
    public joinExercise(
        exerciseId: string,
        clientName: string
    ): UUID | undefined {
        const exercise = exerciseMap.get(exerciseId);
        if (!exercise) {
            return undefined;
        }
        this.chosenExercise = exercise;
        // Although getRoleFromUsedId may throw an error, this should never happen here
        // as the provided id is guaranteed to be one of the ids of the exercise as the exercise
        // was fetched with this exact id from the exercise map.
        const role = this.chosenExercise.getRoleFromUsedId(exerciseId);
        this.relatedExerciseClient = Client.create(
            clientName,
            ClientRole.create(
                role,
                role === 'trainer' ? 'trainer' : 'mapOperator'
            ),
            role !== 'trainer',
            undefined
        );
        this.chosenExercise.addClient(this);
        return this.relatedExerciseClient.id;
    }

    /**
     * Note that this method simply returns when the client did not join an exercise.
     */
    public leaveExercise() {
        if (this.chosenExercise === undefined) {
            // The client has not joined an exercise. Do nothing.
            return;
        }
        this.chosenExercise.removeClient(this);
    }

    public get exercise(): ExerciseWrapper | undefined {
        return this.chosenExercise;
    }

    public get client(): Client | undefined {
        return this.relatedExerciseClient;
    }

    public emitAction(action: ExerciseAction) {
        this.socket.emit('performAction', action);
    }

    public disconnect() {
        this.chosenExercise = undefined;
        if (this.socket.connected) {
            this.socket.disconnect();
        }
    }
}
