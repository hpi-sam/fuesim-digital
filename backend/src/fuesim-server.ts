import express from 'express';
import type { ExerciseService } from 'database/services/exercise-service.js';
import { PeriodicEventHandler } from './exercise/periodic-events/periodic-event-handler.js';
import { ExerciseWebsocketServer } from './exercise/websocket.js';
import { ExerciseHttpServer } from './exercise/http-server.js';
import type { DatabaseService } from './database/services/database-service.js';

export class FuesimServer {
    private readonly _httpServer: ExerciseHttpServer;
    private readonly _websocketServer: ExerciseWebsocketServer;

    private readonly saveTickInterval = 10_000;

    private readonly saveHandler: PeriodicEventHandler;

    public constructor(
        private readonly databaseService: DatabaseService,
        private readonly exerciseService: ExerciseService
    ) {
        const app = express();
        this._websocketServer = new ExerciseWebsocketServer(
            app,
            exerciseService
        );
        this._httpServer = new ExerciseHttpServer(
            app,
            databaseService,
            exerciseService
        );

        this.saveHandler = new PeriodicEventHandler(
            this.exerciseService.saveUnsavedExercises.bind(
                this.exerciseService
            ),
            this.saveTickInterval
        );
        this.saveHandler.start();
    }

    public get websocketServer(): ExerciseWebsocketServer {
        return this._websocketServer;
    }

    public get httpServer(): ExerciseHttpServer {
        return this._httpServer;
    }

    public async destroy() {
        this.httpServer.close();
        this.websocketServer.close();
        this.saveHandler.pause();
        // Save all remaining instances, if it's still possible
        if (this.databaseService.isInitialized) {
            await this.exerciseService.saveUnsavedExercises();
        }
    }
}
