import { createServer } from 'node:http';
import type * as core from 'express-serve-static-core';
import { Server } from 'socket.io';
import { socketIoTransports } from 'fuesim-digital-shared';
import { Config } from '../config.js';
import type { ExerciseSocket, ExerciseServer } from '../exercise-server.js';
import type { Services } from '../database/services/index.js';
import { clientMap } from './client-map.js';
import {
    registerGetStateHandler,
    registerJoinExerciseHandler,
    registerProposeActionHandler,
} from './websocket-handler/index.js';
import { registerJoinParallelExerciseHandler } from './websocket-handler/join-parallel-exercise-handler.js';

export class ExerciseWebsocketServer {
    public readonly exerciseServer: ExerciseServer;
    public constructor(
        app: core.Express,
        private readonly services: Services
    ) {
        Config.initialize();

        const server = createServer(app);

        this.exerciseServer = new Server(server, {
            cors: {
                origin: [Config.httpFrontendUrl],
            },
            ...socketIoTransports,
        });

        this.exerciseServer.listen(Config.websocketPort);

        this.exerciseServer.on('connection', (socket) => {
            try {
                this.registerClient(socket);
            } catch (e) {
                console.error(e);
            }
        });
    }

    private registerClient(client: ExerciseSocket) {
        // register handlers
        registerJoinExerciseHandler(
            this.exerciseServer,
            client,
            this.services.authService,
            this.services.exerciseService
        );
        registerGetStateHandler(this.exerciseServer, client);
        registerProposeActionHandler(this.exerciseServer, client);
        registerJoinExerciseHandler(
            this.exerciseServer,
            client,
            this.services.authService,
            this.services.exerciseService
        );
        registerJoinParallelExerciseHandler(
            this.exerciseServer,
            client,
            this.services.authService,
            this.services.exerciseService,
            this.services.parallelExerciseService
        );

        // Register disconnect handler
        client.on('disconnect', () => {
            try {
                const clientWrapper = clientMap.get(client);
                if (clientWrapper) {
                    clientWrapper.disconnect();
                    clientMap.delete(client);
                }
                if (client.connected) {
                    client.disconnect();
                }
            } catch (e) {
                console.error(e);
            }
        });
    }

    public close(): void {
        this.exerciseServer.close();
    }
}
