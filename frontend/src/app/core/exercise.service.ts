import { Injectable, signal, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ClientToServerEvents,
    ExerciseAction,
    ExerciseKey,
    ExerciseState,
    JoinExerciseResponseData,
    ServerToClientEvents,
    SocketResponse,
} from 'fuesim-digital-shared';
import {
    joinExerciseResponseDataSchema,
    socketIoTransports,
} from 'fuesim-digital-shared';
import { freeze } from 'immer';
import {
    debounceTime,
    filter,
    pairwise,
    Subject,
    switchMap,
    takeUntil,
} from 'rxjs';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { handleChanges } from '../shared/functions/handle-changes';
import type { AppState } from '../state/app.state';
import {
    createApplyServerActionAction,
    createJoinExerciseAction,
    createLeaveExerciseAction,
    createSetExerciseStateAction,
} from '../state/application/application.actions';
import { selectExerciseStateMode } from '../state/application/selectors/application.selectors';
import {
    selectClients,
    selectExerciseState,
} from '../state/application/selectors/exercise.selectors';
import {
    selectCurrentMainRole,
    selectOwnClient,
    selectVisibleVehicles,
} from '../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../state/get-state-snapshot';
import { websocketOrigin } from './api-origins';
import { MessageService } from './messages/message.service';
import { OptimisticActionHandler } from './optimistic-action-handler';
import { openConnectionLostModal } from './connection-lost-modal/open-connection-lost-modal';

/**
 * This Service deals with the state synchronization of a live exercise.
 * In addition, it notifies the user during an exercise of certain events (new client connected, vehicle arrived etc.).
 *
 * While this service should be used for proposing all actions (= changing the state) all
 * read operations should be done via the central frontend store (with the help of selectors).
 */
@Injectable({
    providedIn: 'root',
})
export class ExerciseService {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly messageService = inject(MessageService);
    private readonly ngbModalService = inject(NgbModal);

    private readonly socket: Socket<
        ServerToClientEvents,
        ClientToServerEvents
    > = io(websocketOrigin, {
        ...socketIoTransports,
    });

    private optimisticActionHandler?: OptimisticActionHandler<
        ExerciseAction,
        ExerciseState,
        SocketResponse
    >;

    public readonly additionalExerciseMeta =
        signal<JoinExerciseResponseData | null>(null);

    constructor() {
        this.socket.on('performAction', (action: ExerciseAction) => {
            freeze(action, true);
            this.optimisticActionHandler?.performAction(action);
        });
        this.socket.on('disconnect', (reason) => {
            if (reason === 'io client disconnect') {
                return;
            }
            console.error(reason);
            openConnectionLostModal(this.ngbModalService);
        });
    }

    /**
     * Use the function in ApplicationService instead
     *
     * Join an exercise and retrieve its state
     * Displays an error message if the join failed
     * @returns whether the join was successful
     */
    public async joinExercise(
        exerciseKey: ExerciseKey,
        clientName: string
    ): Promise<boolean> {
        this.socket.connect().on('connect_error', (error) => {
            this.messageService.postError({
                title: 'Fehler beim Verbinden zum Server',
                error,
            });
        });
        const joinResponse = await new Promise<SocketResponse<object>>(
            (resolve) => {
                this.socket.emit(
                    'joinExercise',
                    exerciseKey,
                    clientName,
                    resolve
                );
            }
        );
        if (!joinResponse.success) {
            this.messageService.postError({
                title: 'Fehler beim Beitreten der Übung',
                error: joinResponse.message,
            });
            return false;
        }
        const joinResponsePayload = joinExerciseResponseDataSchema.parse(
            joinResponse.payload
        );
        this.additionalExerciseMeta.set(joinResponsePayload);

        const getStateResponse = await new Promise<
            SocketResponse<ExerciseState>
        >((resolve) => {
            this.socket.emit('getState', resolve);
        });
        freeze(getStateResponse, true);
        if (!getStateResponse.success) {
            this.messageService.postError({
                title: 'Fehler beim Laden der Übung',
                error: getStateResponse.message,
            });
            return false;
        }
        this.store.dispatch(
            createJoinExerciseAction(
                joinResponsePayload.clientId,
                getStateResponse.payload,
                exerciseKey,
                clientName
            )
        );
        // Only do this after the correct state is in the store
        this.optimisticActionHandler = new OptimisticActionHandler<
            ExerciseAction,
            ExerciseState,
            SocketResponse
        >(
            (exercise) =>
                this.store.dispatch(
                    createSetExerciseStateAction(exercise as ExerciseState)
                ),
            () => selectStateSnapshot(selectExerciseState, this.store),
            (action) =>
                this.store.dispatch(
                    createApplyServerActionAction(action as ExerciseAction)
                ),
            async (action) => {
                const response = await new Promise<SocketResponse>(
                    (resolve) => {
                        this.socket.emit(
                            'proposeAction',
                            action as ExerciseAction,
                            resolve
                        );
                    }
                );
                if (!response.success) {
                    const errorMessage = `Action failed: ${response.message}`;
                    if (!response.expected) {
                        this.messageService.postError({
                            title: 'Fehler beim Senden der Aktion',
                            error: errorMessage,
                        });
                    } else {
                        this.messageService.postError(
                            {
                                title: 'Diese Aktion ist nicht gestattet!',
                                body: response.message,
                                error: errorMessage,
                            },
                            null
                        );
                    }
                    console.error(action);
                }
                return response;
            }
        );
        this.startNotifications();
        return true;
    }

    /**
     * Use the function in ApplicationService instead
     */
    public leaveExercise() {
        this.socket.disconnect();
        this.stopNotifications();
        this.optimisticActionHandler = undefined;
        this.store.dispatch(createLeaveExerciseAction());
    }

    /**
     *
     * @param optimistic wether the action should be applied before the server responds (to reduce latency) (this update is guaranteed to be synchronous)
     * @returns the response of the server
     */
    public async proposeAction(action: ExerciseAction, optimistic = false) {
        if (
            selectStateSnapshot(selectExerciseStateMode, this.store) !==
                'exercise' ||
            this.optimisticActionHandler === undefined
        ) {
            // Especially during timeTravel, buttons that propose actions are only deactivated via best effort
            this.messageService.postError({
                title: 'Änderungen konnten nicht vorgenommen werden',
                body: 'Treten Sie der Übung wieder bei.',
            });
            return { success: false };
        }

        // TODO: throw if `response.success` is false
        return this.optimisticActionHandler.proposeAction(action, optimistic);
    }

    private readonly stopNotifications$ = new Subject<void>();

    private startNotifications() {
        // If the user is a trainer, display a message for each joined or disconnected client
        this.store
            .select(selectCurrentMainRole)
            .pipe(
                filter((role) => role === 'trainer'),
                switchMap(() => this.store.select(selectClients)),
                pairwise(),
                takeUntil(this.stopNotifications$)
            )
            .subscribe(([oldClients, newClients]) => {
                handleChanges(oldClients, newClients, {
                    createHandler: (newClient) => {
                        this.messageService.postMessage({
                            title: `${
                                newClient.role.mainRole === 'trainer'
                                    ? 'Übungsleitende'
                                    : 'Teilnehmende'
                            }: ${newClient.name} ist beigetreten.`,
                            color: 'info',
                        });
                    },
                    deleteHandler: (oldClient) => {
                        this.messageService.postMessage({
                            title: `${oldClient.name} hat die Übung verlassen.`,
                            color: 'info',
                        });
                    },
                });
            });
        // If the user is restricted to a viewport, display a message for each vehicle that arrived at this viewport
        this.store
            .select(selectOwnClient)
            .pipe(
                filter(
                    (client) =>
                        client?.viewRestrictedToViewportId !== undefined &&
                        !client.isInWaitingRoom
                ),
                switchMap((client) =>
                    this.store
                        .select(selectVisibleVehicles)
                        // pipe in here so no pairs of events from different viewports are built
                        // Do not trigger the message if the vehicle was removed and added again at the same time
                        .pipe(debounceTime(0), pairwise())
                ),
                takeUntil(this.stopNotifications$)
            )
            .subscribe(([oldVehicles, newVehicles]) => {
                handleChanges(oldVehicles, newVehicles, {
                    createHandler: (newVehicle) => {
                        this.messageService.postMessage({
                            title: `${newVehicle.name} ist eingetroffen.`,
                            color: 'info',
                        });
                    },
                });
            });
    }

    private stopNotifications() {
        this.stopNotifications$.next();
    }
}
