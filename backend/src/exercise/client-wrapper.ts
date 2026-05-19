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
import {
    BehaviorSubject,
    filter,
    merge,
    partition,
    scan,
    Subject,
    withLatestFrom,
    type Subscription,
} from 'rxjs';
import cookie from 'cookie';
import type { ExerciseSocket } from '../exercise-server.js';
import { Config, isDevelopment } from '../config.js';
import type { SessionInformation } from '../auth/auth-service.js';
import type { ParallelExercise } from '../database/schema.js';
import { PermissionDeniedError } from '../utils/http.js';
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
    public joinExercise(exerciseKey: ExerciseKey, clientName: string): UUID {
        this.chosenExercise = this.services.exerciseService.getExerciseByKey(
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
        this.leaveExercise();
        super.disconnect();
    }
}

export const THROTTLED_ACTIONS: Set<ExerciseAction['type']> = new Set([
    '[Exercise] Tick',
    '[Exercise] Start',
    '[Exercise] Pause',
]);

export class ParallelExerciseClientWrapper extends ClientWrapper {
    private chosenExercise: ParallelExercise | null = null;
    private readonly subscriptions: Subscription[] = [];

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

        const exerciseCount = new BehaviorSubject(activeExercises.length);

        // Combine actions from all exercises into one stream
        const aggregatedActions = new Subject<boolean>();
        for (const activeExercise of activeExercises) {
            const sub = activeExercise.actionApplied.subscribe((v) =>
                aggregatedActions.next(v)
            );
            this.subscriptions.push(sub);
        }

        // We watch for new exercise instances to join the parallel exercise
        // to register watchers for them
        const joinSub = this.services.parallelExerciseService.newJoin
            .pipe(filter((join) => id === join.parallelExerciseId))
            .subscribe((join) => {
                const sub = join.activeExercise.actionApplied.subscribe((v) =>
                    aggregatedActions.next(v)
                );
                exerciseCount.next(exerciseCount.value + 1);
                this.subscriptions.push(sub);
                aggregatedActions.next(false);
            });
        this.subscriptions.push(joinSub);

        const [throttledActions$, unthrottledActions$] = partition(
            aggregatedActions.asObservable(),
            Boolean
        );

        const filteredThrottledActions$ = throttledActions$.pipe(
            withLatestFrom(exerciseCount),
            scan((counter, [, n]) => (counter + 1) % n, 0),
            filter((counter) => counter === 0)
        );

        const actionSub = merge(
            unthrottledActions$,
            filteredThrottledActions$
        ).subscribe(async () => this.onActionApplied());
        this.subscriptions.push(actionSub);
    }

    public async onActionApplied(action: ExerciseAction | null = null) {
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
        return this.services.parallelExerciseService.getParallelExerciseInstanceSummariesById(
            this.chosenExercise!.id,
            this.session
        );
    }

    public async applyActionToAll(action: ExerciseAction) {
        if (!this.session) {
            throw new PermissionDeniedError();
        }
        const activeExercises =
            await this.services.parallelExerciseService.getParallelExerciseInstancesById(
                this.chosenExercise!.id,
                this.session
            );
        for (const activeExercise of activeExercises) {
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

    public async start() {
        await this.applyActionToAll({
            type: '[Exercise] Start',
        } satisfies StartExerciseAction);
    }

    public async pause() {
        await this.applyActionToAll({
            type: '[Exercise] Pause',
        } satisfies PauseExerciseAction);
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
