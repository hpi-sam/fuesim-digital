import { createServer } from 'node:http';
import type * as core from 'express-serve-static-core';
import { Server } from 'socket.io';
import { socketIoTransports } from 'digital-fuesim-manv-shared';
import { Config } from '../config.js';
import type { ExerciseSocket, ExerciseServer } from '../exercise-server.js';
import type { ExerciseService } from './../database/services/exercise-service.js';
import { clientMap } from './client-map.js';
import { ClientWrapper } from './client-wrapper.js';
import {
    registerGetStateHandler,
    registerJoinExerciseHandler,
    registerProposeActionHandler,
} from './websocket-handler/index.js';

export class ExerciseWebsocketServer {
    public readonly exerciseServer: ExerciseServer;
    public constructor(
        app: core.Express,
        private readonly exerciseService: ExerciseService
    ) {
        const server = createServer(app);

        this.exerciseServer = new Server(server, {
            // TODO: this is only a temporary solution to make this work
            cors: {
                origin: '*',
            },
            ...socketIoTransports,
        });

        this.exerciseServer.listen(Config.websocketPort);

        this.exerciseServer.on('connection', (socket) => {
            this.registerClient(socket);
        });

    }

    private registerClient(client: ExerciseSocket): void {
        // Add client
        clientMap.set(client, new ClientWrapper(client, this.exerciseService));

        // register handlers
        registerGetStateHandler(this.exerciseServer, client);
        registerProposeActionHandler(this.exerciseServer, client);
        registerJoinExerciseHandler(this.exerciseServer, client);

        // Register disconnect handler
        client.on('disconnect', () => {
            clientMap.get(client)!.leaveExercise();
            clientMap.delete(client);
        });
    }

    public close(): void {
        this.exerciseServer.close();
    }
}
