import type { Server as HttpServer } from 'node:http';
import cors from 'cors';
import type { Express } from 'express';
import express from 'express';
import cookieParser from 'cookie-parser';
import { Config } from '../config.js';
import type { DatabaseService } from '../database/services/database-service.js';
import { AuthHttpRouter } from '../auth/auth-http-router.js';
import type { ExerciseService } from './../database/services/exercise-service.js';
import { HealthHttpRouter } from './health-router.js';
import type { ExerciseManagerService } from './database/services/exercise-manager-service.js';
import type { AuthService } from './auth/auth-service.js';
import { ApplicationRouter } from './application-routers/application-router.js';

export class ApiHttpServer {
    public readonly httpServer: HttpServer;
    /**
     * @param uploadLimit in Megabyte can be set via ENV DFM_UPLOAD_LIMIT
     */
    public constructor(
        app: Express,
        databaseService: DatabaseService,
        exerciseService: ExerciseService,
        authService: AuthService,
        exerciseManagerService: ExerciseManagerService
    ) {
        Config.initialize();

        app.use(
            cors({
                origin: [Config.httpFrontendUrl],
                credentials: true,
            })
        );

        app.use(cookieParser());

        app.use(express.json({ limit: `${Config.uploadLimit}mb` }));

        app.use(new HealthHttpRouter().router);
        app.use(
            new ApplicationRouter(
                authService,
                exerciseService,
                exerciseManagerService
            ).router
        );

        app.use('/api/auth', new AuthHttpRouter(authService).router);

        this.httpServer = app.listen(Config.httpPort, () => {
            console.log(`HTTP server listening on port ${Config.httpPort}`);
        });
    }

    public close(): void {
        this.httpServer.close();
    }
}
