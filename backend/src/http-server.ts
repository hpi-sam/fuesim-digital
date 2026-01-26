import type { Server as HttpServer } from 'node:http';
import cors from 'cors';
import type { Express } from 'express';
import express from 'express';
import cookieParser from 'cookie-parser';
import { Config } from '../config.js';
import type { DatabaseService } from '../database/services/database-service.js';
import { AuthHttpRouter } from '../auth/auth-http-router.js';
import type { ExerciseService } from './../database/services/exercise-service.js';
import {
    deleteExercise,
    getExercise,
    getExerciseHistory,
    postExercise,
} from './http-handler/api/exercise.js';
import { getHealth } from './http-handler/api/health.js';
import { secureHttp } from './http-handler/secure-http.js';
import type { ExerciseManagerService } from './database/services/exercise-manager-service.js';
import {
    deleteExerciseTemplate,
    getExercises,
    getExerciseTemplates,
    patchExerciseTemplate,
    postExerciseTemplate,
    postNewExerciseFromTemplate,
} from './http-handler/api/exercise-manager.js';
import { AuthHttpRouter } from './auth/auth-http-router.js';
import type { AuthService } from './auth/auth-service.js';

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

        // This endpoint is used to determine whether the API itself is running.
        // It should be independent from any other services that may or may not be running.
        // This is used for the Cypress CI.
        app.get('/api/health', async (_req, res) =>
            secureHttp(getHealth, _req, res)
        );
        app.post('/api/exercise', async (req, res) =>
            secureHttp(
                async () => postExercise(exerciseService, req.body),
                req,
                res
            )
        );
        app.get('/api/exercise/:exerciseKey', async (req, res) =>
            secureHttp(
                () => getExercise(req.params.exerciseKey, exerciseService),
                req,
                res
            )
        );
        app.delete('/api/exercise/:exerciseKey', async (req, res) =>
            secureHttp(
                async () =>
                    deleteExercise(req.params.exerciseKey, exerciseService),
                req,
                res
            )
        );
        app.get('/api/exercise/:exerciseKey/history', async (req, res) =>
            secureHttp(
                async () =>
                    getExerciseHistory(req.params.exerciseKey, exerciseService),
                req,
                res
            )
        );

        app.get('/api/exercises/', async (req, res) =>
            secureHttp(
                async () => getExercises(exerciseManagerService),
                req,
                res
            )
        );

        app.get('/api/exercise_templates/', async (req, res) =>
            secureHttp(
                async () => getExerciseTemplates(exerciseManagerService),
                req,
                res
            )
        );
        app.post('/api/exercise_template/', async (req, res) =>
            secureHttp(
                async () =>
                    postExerciseTemplate(
                        exerciseManagerService,
                        exerciseService,
                        req.body
                    ),
                req,
                res
            )
        );
        app.post('/api/exercise_template/:id/new', async (req, res) =>
            secureHttp(
                async () =>
                    postNewExerciseFromTemplate(
                        exerciseManagerService,
                        exerciseService,
                        req.params.id
                    ),
                req,
                res
            )
        );
        app.patch('/api/exercise_template/:id', async (req, res) =>
            secureHttp(
                async () =>
                    patchExerciseTemplate(
                        exerciseManagerService,
                        req.params.id,
                        req.body
                    ),
                req,
                res
            )
        );
        app.delete('/api/exercise_template/:id', async (req, res) =>
            secureHttp(
                async () =>
                    deleteExerciseTemplate(
                        req.params.id,
                        exerciseManagerService,
                        exerciseService
                    ),
                req,
                res
            )
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
