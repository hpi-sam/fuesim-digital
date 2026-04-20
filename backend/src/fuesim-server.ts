import express from 'express';
import { PeriodicEventHandler } from './exercise/periodic-events/periodic-event-handler.js';
import { ExerciseWebsocketServer } from './exercise/websocket.js';
import { ApiHttpServer } from './http-server.js';
import type { Services } from './database/services/index.js';

export class FuesimServer {
    private readonly _httpServer: ApiHttpServer;
    private readonly _websocketServer: ExerciseWebsocketServer;

    private readonly exerciseUpkeepTickInterval = 10_000;

    private readonly exerciseUpkeepHandler: PeriodicEventHandler;

    public async exerciseUpkeepTick() {
        await this.services.exerciseService.saveUnsavedExercises();
        await this.services.exerciseService.unloadEmptyExercises();
    }

    public constructor(private readonly services: Services) {
        const app = express();
        this._websocketServer = new ExerciseWebsocketServer(app, this.services);
        this._httpServer = new ApiHttpServer(app, services);

        this.exerciseUpkeepHandler = new PeriodicEventHandler(
            this.exerciseUpkeepTick.bind(this),
            this.exerciseUpkeepTickInterval
        );
        this.exerciseUpkeepHandler.start();
    }

    public get websocketServer(): ExerciseWebsocketServer {
        return this._websocketServer;
    }

    public get httpServer(): ApiHttpServer {
        return this._httpServer;
    }

    public async destroy() {
        this.httpServer.close();
        this.websocketServer.close();
        this.exerciseUpkeepHandler.pause();
        // Save all remaining instances, if it's still possible
        if (this.services.databaseService.isInitialized) {
            await this.exerciseUpkeepTick();
        }
    }
}
