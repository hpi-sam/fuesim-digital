import type {
    ExerciseAction,
    ExerciseKey,
    UUID,
    StartExerciseAction,
    PauseExerciseAction,
    ParallelExerciseId,
    Client,
} from 'fuesim-digital-shared';
import { ReducerError, newClient, newClientRole } from 'fuesim-digital-shared';
import { Subject, filter, throttleTime, type Subscription } from 'rxjs';
import cookie from 'cookie';
import type { ExerciseSocket } from '../exercise-server.js';
import { Config, isDevelopment } from '../config.js';
import type { SessionInformation } from '../auth/auth-service.js';
import type { ParallelExercise } from '../database/schema.js';
import { ApiError, PermissionDeniedError } from '../utils/http.js';
import type { Services } from '../database/services/index.js';
import type { ActiveExercise } from './active-exercise.js';
import { clientMap } from './client-map.js';

/**
 * Wraps a {@link ExerciseSocket} for different types of clients.
 */
export abstract class ClientWrapper {
    public session?: SessionInformation;

    public constructor(
        public readonly socket: ExerciseSocket,
        public readonly services: Services
    ) {}

    public static init<T extends typeof ClientWrapper>(
        wrapperClass: T,
        socket: ExerciseSocket,
        services: Services
    ): InstanceType<T> | undefined {
        if (clientMap.get(socket)) {
            // Already registered
            return;
        }
        // @ts-expect-error typing
        const wrapper = new wrapperClass(socket, services);
        clientMap.set(socket, wrapper);
        return wrapper;
    }
    public async getSessionInformation() {
        const cookies = cookie.parse(this.socket.request.headers.cookie ?? '');
        const sessionToken =
            cookies[this.services.authService.SESSION_COOKIE_NAME] ?? '';

        this.session =
            await this.services.authService.getDataFromSessionToken(
                sessionToken
            );
    }

    public disconnect() {
        this.socket.disconnect();
    }
}

export class ExerciseClientWrapper extends ClientWrapper {
    private chosenExercise?: ActiveExercise;

    private relatedExerciseClient?: Client;

    /**
     * @param exerciseKey The exercise key to be used for the client.
     * @param clientName The public name of the client.
     * @returns The joined client's id, or undefined when the exercise doesn't exist.
     */
    public async joinExercise(
        exerciseKey: ExerciseKey,
        clientName: string
    ): Promise<UUID> {
        this.chosenExercise =
            await this.services.exerciseService.getExerciseByKey(
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
     * Reconnect to an existing inactive client in an exercise.
     * @param exerciseKey The exercise key to use.
     * @param clientId The id of the existing (inactive) client to set active.
     * @returns The client's id on success, or null if the client could not be reconnected.
     */
    public async reconnectToExercise(
        exerciseKey: ExerciseKey,
        clientId: UUID
    ): Promise<UUID | null> {
        this.chosenExercise =
            await this.services.exerciseService.getExerciseByKey(
                exerciseKey,
                this.session
            );
        const existingClient =
            this.chosenExercise.getStateSnapshot().clients[clientId];
        if (existingClient?.isActive) {
            this.chosenExercise = undefined;
            return null;
        }
        this.relatedExerciseClient = existingClient;
        this.chosenExercise.setClientActive(this);
        return existingClient?.id ?? null;
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
        if (
            this.chosenExercise !== undefined &&
            this.relatedExerciseClient !== undefined
        ) {
            this.chosenExercise.setClientInactive(this);
            this.chosenExercise = undefined;
        }
        super.disconnect();
    }
}

export class ParallelExerciseClientWrapper extends ClientWrapper {
    private chosenExercise: ParallelExercise | null = null;
    private readonly subscriptions: Subscription[] = [];
    private readonly cachedActiveExercises: ActiveExercise[] = [];
    private readonly aggregatedActions = new Subject<void>();

    public async joinParallelExercise(id: ParallelExerciseId) {
        if (!this.session) {
            throw new PermissionDeniedError();
        }
        this.chosenExercise =
            await this.services.parallelExerciseService.getParallelExerciseById(
                id,
                this.session
            );
        const activeExercises =
            await this.services.parallelExerciseService.getParallelExerciseInstancesById(
                id,
                this.session
            );

        // One throttled subscription drives all client updates
        const throttledSub = this.aggregatedActions
            .pipe(
                throttleTime(200, undefined, {
                    leading: true,
                    trailing: true, // Ensures the last value is emitted when enough time has passed. This prevents latest changes not being propagated due to throttling.
                })
            )
            .subscribe(() => this.emitUpdateExerciseInstances());
        this.subscriptions.push(throttledSub);

        // We watch for new exercise instances to join the parallel exercise
        // to register watchers for them
        const joinSub = this.services.parallelExerciseService.newJoin
            .pipe(filter((join) => id === join.parallelExerciseId))
            .subscribe((join) => {
                this.cachedActiveExercises.push(join.activeExercise);
                const sub = join.activeExercise.actionApplied.subscribe(() =>
                    this.aggregatedActions.next()
                );
                this.subscriptions.push(sub);
                this.emitUpdateExerciseInstances();
            });
        this.subscriptions.push(joinSub);

        // Watch for changes in the exercise instances to send updates
        for (const activeExercise of activeExercises) {
            this.cachedActiveExercises.push(activeExercise);
            const sub = activeExercise.actionApplied.subscribe(() =>
                this.aggregatedActions.next()
            );
            this.subscriptions.push(sub);
        }
    }

    public emitUpdateExerciseInstances() {
        this.socket.emit('updateExerciseInstances', {
            exerciseInstances: this.getInstanceSummaries(),
        });
    }

    /**
     * Get summaries of all exercise instances
     */
    public getInstanceSummaries() {
        return this.services.parallelExerciseService.getParallelExerciseInstanceSummaries(
            this.cachedActiveExercises
        );
    }

    public applyActionToAll(action: ExerciseAction) {
        for (const activeExercise of this.cachedActiveExercises) {
            try {
                activeExercise.applyAction(action, null);
            } catch (e: unknown) {
                if (!(e instanceof ReducerError)) {
                    throw e;
                }
                console.error(e);
            }
        }
    }

    public start() {
        this.applyActionToAll({
            type: '[Exercise] Start',
        } satisfies StartExerciseAction);
    }

    public pause() {
        this.applyActionToAll({
            type: '[Exercise] Pause',
        } satisfies PauseExerciseAction);
    }

    public async getParallelTracesOverview() {
        if (!this.chosenExercise) throw new ApiError();
        return this.services.parallelExerciseService.getParallelTracesOverviewById(
            this.chosenExercise.id
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
