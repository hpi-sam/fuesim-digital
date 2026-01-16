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

export class ExerciseHttpServer {
    public readonly httpServer: HttpServer;
    /**
     * @param uploadLimit in Megabyte can be set via ENV DFM_UPLOAD_LIMIT
     */
    public constructor(
        app: Express,
        databaseService: DatabaseService,
        exerciseService: ExerciseService
    ) {
        // TODO: Temporary allow all
        app.use(cors());

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

        this.httpServer = app.listen(Config.httpPort);
    }

    public close(): void {
        this.httpServer.close();
    }
}
