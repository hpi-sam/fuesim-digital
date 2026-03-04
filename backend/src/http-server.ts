import type { Server as HttpServer } from 'node:http';
import cors from 'cors';
import type { Express } from 'express';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createExerciseRouter } from './routers/exercise-router.js';
import { createAuthRouter } from './routers/auth-router.js';
import type { ExerciseManagerService } from './database/services/exercise-manager-service.js';
import type { AuthService, SessionInformation } from './auth/auth-service.js';
import {
    createSessionMiddleware,
    errorHandler,
} from './utils/http-handlers.js';
import type { ExerciseService } from './database/services/exercise-service.js';
import { Config } from './config.js';
import { createExerciseManagerRouter } from './routers/exercise-manager-router.js';
import { healthRouter } from './routers/health-router.js';

declare global {
    namespace Express {
        interface Request {
            session?: SessionInformation;
        }
    }
}

export class ApiHttpServer {
    public readonly httpServer: HttpServer;
    public constructor(
        app: Express,
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
        app.use(createSessionMiddleware(authService));

        app.use(express.json({ limit: `${Config.uploadLimit}mb` }));

        app.use('/api', healthRouter);

        app.use('/api', createExerciseRouter(exerciseService));

        app.use(
            '/api',
            createExerciseManagerRouter(exerciseManagerService, exerciseService)
        );

        app.use('/api/auth', createAuthRouter(authService));

        app.use(errorHandler);

        this.httpServer = app.listen(Config.httpPort, () => {
            console.log(`HTTP server listening on port ${Config.httpPort}`);
        });
    }

    public close() {
        this.httpServer.close();
    }
}
