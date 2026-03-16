import { createServer } from 'node:http';
import type * as core from 'express-serve-static-core';
import { Server } from 'socket.io';
import { socketIoTransports } from 'fuesim-digital-shared';
import { Config } from '../config.js';
import type { ExerciseSocket, ExerciseServer } from '../exercise-server.js';
import type { AuthService } from '../auth/auth-service.js';
import type { ExerciseService } from './../database/services/exercise-service.js';
import { clientMap } from './client-map.js';
import {
    registerGetStateHandler,
    registerJoinExerciseHandler,
    registerProposeActionHandler,
} from './websocket-handler/index.js';

export class ExerciseWebsocketServer {
    public readonly exerciseServer: ExerciseServer;
    public constructor(
        app: core.Express,
        private readonly exerciseService: ExerciseService,
        private readonly authService: AuthService
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
            this.authService,
            this.exerciseService
        );
        registerGetStateHandler(this.exerciseServer, client);
        registerProposeActionHandler(this.exerciseServer, client);

        // Register disconnect handler
        client.on('disconnect', () => {
            try {
                const clientWrapper = clientMap.get(client);
                if (clientWrapper) {
                    clientWrapper.leaveExercise();
                    clientMap.delete(client);
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
