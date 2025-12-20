import type { Server as HttpServer } from 'node:http';
import cors from 'cors';
import type { Express } from 'express';
import express from 'express';
import { Config } from '../config.js';
import type { DatabaseService } from '../database/services/database-service.js';
import type { ExerciseService } from './../database/services/exercise-service.js';
import {
    deleteExercise,
    getExercise,
    getExerciseHistory,
    postExercise,
} from './http-handler/api/exercise.js';
import { getHealth } from './http-handler/api/health.js';
import { secureHttp } from './http-handler/secure-http.js';
import type { AuthService } from '../auth.js';
import cookieParser from "cookie-parser";

export class ExerciseHttpServer {
    public readonly httpServer: HttpServer;
    /**
     * @param uploadLimit in Megabyte can be set via ENV DFM_UPLOAD_LIMIT
     */
    public constructor(
        app: Express,
        databaseService: DatabaseService,
        exerciseService: ExerciseService,
        authService: AuthService
    ) {
        // TODO: Temporary allow all
        app.use(cors());

        app.use(cookieParser())

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
        app.get('/api/exercise/:exerciseId', async (req, res) =>
            secureHttp(
                () => getExercise(req.params.exerciseId, exerciseService),
                req,
                res
            )
        );
        app.delete('/api/exercise/:exerciseId', async (req, res) =>
            secureHttp(
                async () =>
                    deleteExercise(req.params.exerciseId, exerciseService),
                req,
                res
            )
        );
        app.get('/api/exercise/:exerciseId/history', async (req, res) =>
            secureHttp(
                async () =>
                    getExerciseHistory(req.params.exerciseId, exerciseService),
                req,
                res
            )
        );

        app.get("/api/auth/oidc-redirect", (req, res) => {
            authService.handleRedirect(req, res);
        });
        app.get("/api/auth/oidc-callback", (req, res) => {
            authService.handleCallback(req, res);
        });

        this.httpServer = app.listen(Config.httpPort);
    }

    public close(): void {
        this.httpServer.close();
    }
}
