import { createServer } from 'node:http';
import type * as core from 'express-serve-static-core';
import { Server } from 'socket.io';
import { socketIoTransports } from 'digital-fuesim-manv-shared';
import cookie from 'cookie';
import { Config } from '../config.js';
import type { ExerciseSocket, ExerciseServer } from '../exercise-server.js';
import type { AuthService } from '../auth/auth-service.js';
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

        this.exerciseServer.on('connection', async (socket) => {
            try {
                await this.registerClient(socket);
            } catch (e) {
                console.error(e);
            }
        });
    }

    private async registerClient(client: ExerciseSocket) {
        const cookies = cookie.parse(client.request.headers.cookie ?? '');
        const sessionToken = cookies[this.authService.SESSION_COOKIE_NAME];
        const session = sessionToken
            ? await this.authService.getDataFromSessionToken(sessionToken)
            : undefined;

        // Add client
        clientMap.set(
            client,
            new ClientWrapper(client, this.exerciseService, session)
        );

        // register handlers
        registerGetStateHandler(this.exerciseServer, client);
        registerProposeActionHandler(this.exerciseServer, client);
        registerJoinExerciseHandler(this.exerciseServer, client);

        // Register disconnect handler
        client.on('disconnect', () => {
            try {
                clientMap.get(client)!.leaveExercise();
                clientMap.delete(client);
            } catch (e) {
                console.error(e);
            }
        });
    }

    public close(): void {
        this.exerciseServer.close();
    }
}
