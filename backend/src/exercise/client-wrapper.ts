import type {
    ExerciseAction,
    ExerciseKey,
    UUID,
    Client,
} from 'fuesim-digital-shared';
import { newClient, newClientRole } from 'fuesim-digital-shared';
import cookie from 'cookie';
import type { ExerciseSocket } from '../exercise-server.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import { Config, isDevelopment } from '../config.js';
import type { AuthService, SessionInformation } from '../auth/auth-service.js';
import type { ActiveExercise } from './active-exercise.js';

export class ClientWrapper {
    public session?: SessionInformation;

    public constructor(
        private readonly socket: ExerciseSocket,
        private readonly exerciseService: ExerciseService,
        private readonly authService: AuthService
    ) {}

    private chosenExercise?: ActiveExercise;

    private relatedExerciseClient?: Client;

    public async getSessionInformation() {
        const cookies = cookie.parse(this.socket.request.headers.cookie ?? '');
        const sessionToken =
            cookies[this.authService.SESSION_COOKIE_NAME] ?? '';

        this.session =
            await this.authService.getDataFromSessionToken(sessionToken);
    }

    /**
     * @param exerciseKey The exercise key to be used for the client.
     * @param clientName The public name of the client.
     * @returns The joined client's id, or undefined when the exercise doesn't exists.
     */
    public joinExercise(exerciseKey: ExerciseKey, clientName: string): UUID {
        this.chosenExercise = this.exerciseService.getExerciseByKey(
            exerciseKey,
            this.session
        );
        // Although getRoleFromUsedId may throw an error, this should never happen here
        // as the provided id is guaranteed to be one of the ids of the exercise as the exercise
        // was fetched with this exact id from the exercise map.
        const role = this.chosenExercise.getRoleFromUsedKey(exerciseKey);
        this.relatedExerciseClient = newClient(
            clientName,
            newClientRole(role, role === 'trainer' ? 'trainer' : 'mapOperator'),
            Config.devNoWaitingRoom && isDevelopment()
                ? false
                : role !== 'trainer'
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

        this.exerciseService.leaveExercise(
            this.chosenExercise.participantKey,
            this
        );
    }

    public get exercise(): ActiveExercise | undefined {
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
