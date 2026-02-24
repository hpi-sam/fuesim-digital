import type { ExerciseAction, ExerciseKey, UUID } from 'fuesim-digital-shared';
import { Client } from 'fuesim-digital-shared';
import { filter, type Subscription } from 'rxjs';
import { newClient, newClientRole } from 'fuesim-digital-shared';
import cookie from 'cookie';
import type { ExerciseSocket } from '../exercise-server.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import type {
    ParallelExercise,
    ParallelExerciseId,
} from '../database/schema.js';
import type { ParallelExerciseService } from '../database/services/parallel-exercise-service.js';
import { PermissionDeniedError } from '../utils/http.js';
import type { AuthService, SessionInformation } from '../auth/auth-service.js';
import type { ActiveExercise } from './active-exercise.js';

/**
 * Wraps a {@link ExerciseSocket} for different types of clients.
 */
export abstract class ClientWrapper {
    public session?: SessionInformation;

    protected constructor(
        public readonly socket: ExerciseSocket,
        private readonly authService: AuthService
    ) {}

    public async getSessionInformation() {
        const cookies = cookie.parse(this.socket.request.headers.cookie ?? '');
        const sessionToken =
            cookies[this.authService.SESSION_COOKIE_NAME] ?? '';

        this.session =
            await this.authService.getDataFromSessionToken(sessionToken);
    }

    public disconnect() {
        /* empty */
    }
}

export class ExerciseClientWrapper extends ClientWrapper {
    public constructor(
        public override readonly socket: ExerciseSocket,
        public override readonly authService: AuthService,
        private readonly exerciseService: ExerciseService
    ) {
        super(socket, authService);
    }

    private chosenExercise?: ActiveExercise;

    private relatedExerciseClient?: Client;

    /**
     * @param exerciseKey The exercise key to be used for the client.
     * @param clientName The public name of the client.
     * @returns The joined client's id, or undefined when the exercise doesn't exist.
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
            role !== 'trainer'
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
        this.chosenExercise = undefined;
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

    public override disconnect() {
        this.leaveExercise();
        super.disconnect();
    }
}

export class ParallelExerciseClientWrapper extends ClientWrapper {
    public constructor(
        public override readonly socket: ExerciseSocket,
        public override readonly authService: AuthService,
        private readonly exerciseService: ExerciseService,
        private readonly parallelExerciseService: ParallelExerciseService
    ) {
        super(socket, authService);
    }

    private chosenExercise: ParallelExercise | null = null;
    private readonly subscriptions: Subscription[] = [];

    public async joinParallelExercise(id: ParallelExerciseId) {
        if (!this.session) {
            throw new PermissionDeniedError();
        }
        this.chosenExercise =
            await this.parallelExerciseService.getParallelExerciseById(
                id,
                this.session
            );
        const activeExercises =
            await this.parallelExerciseService.getParallelExerciseInstancesById(
                id,
                this.session
            );

        // We watch for new exercise instances to join the parallel exercise
        // to register watchers for them
        this.parallelExerciseService.newJoin
            .pipe(filter((join) => id === join.parallelExerciseId))
            .subscribe((join) => {
                const sub = join.activeExercise.actionApplied.subscribe(
                    async () => this.onActionApplied()
                );
                this.subscriptions.push(sub);
                this.onActionApplied();
            });

        // Watch for changes in the exercise instances to send updates
        for (const activeExercise of activeExercises) {
            const sub = activeExercise.actionApplied.subscribe(async () =>
                this.onActionApplied()
            );
            this.subscriptions.push(sub);
        }
    }

    public async onActionApplied() {
        this.socket.emit('updateExerciseInstances', {
            exerciseInstances: await this.getInstanceSummaries(),
        });
    }

    /**
     * Get summaries of all exercise instances
     */
    public async getInstanceSummaries() {
        if (!this.session) {
            throw new PermissionDeniedError();
        }
        return this.parallelExerciseService.getParallelExerciseInstanceSummariesById(
            this.chosenExercise!.id,
            this.session
        );
    }

    /**
     * Leave this parallel exercise
     */
    public leaveParallelExercise() {
        for (const sub of this.subscriptions) {
            sub.unsubscribe();
        }
    }

    public get exercise() {
        return this.chosenExercise;
    }

    /**
     * Disconnect the websocket client
     */
    public override disconnect() {
        this.leaveParallelExercise();
        super.disconnect();
    }
}
