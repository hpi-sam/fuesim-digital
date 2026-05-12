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

        // The upload limit is specified as a Nginx compatible size (https://nginx.org/en/docs/syntax.html#size) (i.e., can have a "k", "m", or "g" suffix)
        // Express parses the limit using https://github.com/visionmedia/bytes.js#bytesparsestringnumber-value-numbernull, so we have to append "b"
        app.use(express.json({ limit: `${Config.uploadLimit}b` }));

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

        app.use(errorHandler);

        this.httpServer = app.listen(Config.httpPort, () => {
            console.log(`HTTP server listening on port ${Config.httpPort}`);
        });
    }

    public close() {
        this.httpServer.close();
    }
}
