import { Injectable, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
    ClientToServerEvents,
    ParallelExerciseInstanceSummary,
    ServerToClientEvents,
    SocketResponse,
    UUID,
    UpdateParallelExerciseResponseData,
    joinParallelExerciseResponseDataSchema,
    socketIoTransports,
} from 'fuesim-digital-shared';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { AppState } from '../state/app.state';
import { websocketOrigin } from './api-origins';
import { MessageService } from './messages/message.service';
import { openConnectionLostModal } from './connection-lost-modal/open-connection-lost-modal';

@Injectable({
    providedIn: 'root',
})
export class ParallelExerciseService {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly messageService = inject(MessageService);
    private readonly ngbModalService = inject(NgbModal);

    private readonly socket: Socket<
        ServerToClientEvents,
        ClientToServerEvents
    > = io(websocketOrigin, {
        ...socketIoTransports,
    });

    public readonly exerciseInstances = signal<
        ParallelExerciseInstanceSummary[]
    >([]);
    constructor() {
        this.socket.on(
            'updateExerciseInstances',
            (data: UpdateParallelExerciseResponseData) => {
                this.exerciseInstances.set(data.exerciseInstances);
            }
        );
        this.socket.on('disconnect', (reason) => {
            if (reason === 'io client disconnect') {
                return;
            }
            console.error(reason);
            openConnectionLostModal(this.ngbModalService);
        });
    }

    public async joinParallelExercise(id: UUID) {
        this.socket.connect().on('connect_error', (error) => {
            this.messageService.postError({
                title: 'Fehler beim Verbinden zum Server',
                error,
            });
        });
        const joinResponse = await new Promise<SocketResponse<object>>(
            (resolve) => {
                this.socket.emit('joinParallelExercise', id, resolve);
            }
        );

        if (!joinResponse.success) {
            this.messageService.postError({
                title: 'Fehler beim Beitreten der Parallelübung',
                error: joinResponse.message,
            });
            return false;
        }
        const parsedResponse = joinParallelExerciseResponseDataSchema.parse(
            joinResponse.payload
        );
        this.exerciseInstances.set(parsedResponse.exerciseInstances);
        return true;
    }

    public async startParallelExercise() {
        const joinResponse = await new Promise<SocketResponse>((resolve) => {
            this.socket.emit('startParallelExercise', resolve);
        });

        if (!joinResponse.success) {
            this.messageService.postError({
                title: 'Fehler beim Starten der Parallelübung',
                error: joinResponse.message,
            });
            return false;
        }
        return true;
    }

    public async pauseParallelExercise() {
        const joinResponse = await new Promise<SocketResponse>((resolve) => {
            this.socket.emit('pauseParallelExercise', resolve);
        });

        if (!joinResponse.success) {
            this.messageService.postError({
                title: 'Fehler beim Pausieren der Parallelübung',
                error: joinResponse.message,
            });
            return false;
        }
        return true;
    }

    public leaveParallelExercise() {
        this.socket.disconnect();
    }
}
