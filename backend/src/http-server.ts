import type { Server as HttpServer } from 'node:http';
import cors from 'cors';
import type { Express } from 'express';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createExerciseRouter } from './routers/exercise-router.js';
import { createAuthRouter } from './routers/auth-router.js';
import type { SessionInformation } from './auth/auth-service.js';
import {
    createSessionMiddleware,
    errorHandler,
} from './utils/http-handlers.js';
import { Config } from './config.js';
import { createExerciseManagerRouter } from './routers/exercise-manager-router.js';
import { healthRouter } from './routers/health-router.js';
import type { Services } from './database/services/index.js';
import { createParallelExerciseRouter } from './routers/parallel-exercise-router.js';
import { createCollectionsRouter } from './routers/collections-router.js';

declare global {
    namespace Express {
        interface Request {
            session?: SessionInformation;
        }
    }
}

export class ApiHttpServer {
    public readonly httpServer: HttpServer;
    public constructor(app: Express, services: Services) {
        Config.initialize();

        app.use(
            cors({
                origin: [Config.httpFrontendUrl],
                credentials: true,
            })
        );

        app.use(cookieParser());
        app.use(createSessionMiddleware(services.authService));

        app.use(express.json({ limit: `${Config.uploadLimit}mb` }));

        app.use('/api', healthRouter);

        app.use('/api', createExerciseRouter(services.exerciseService));

        app.use(
            '/api',
            createExerciseManagerRouter(services.exerciseManagerService)
        );

        app.use(
            '/api/parallel_exercises/',
            createParallelExerciseRouter(services.parallelExerciseService)
        );

        app.use('/api/auth', createAuthRouter(services.authService));

        app.use(
            '/api/collections',
            createCollectionsRouter(services.collectionService)
        );

        app.use(errorHandler);

        this.httpServer = app.listen(Config.httpPort, () => {
            console.log(`HTTP server listening on port ${Config.httpPort}`);
        });
    }

    public close() {
        this.httpServer.close();
    }
}
