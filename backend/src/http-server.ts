import type { Server as HttpServer } from 'node:http';
import cors from 'cors';
import type { Express } from 'express';
import express from 'express';
import { exerciseTemplatesSchema } from 'digital-fuesim-manv-shared';
import { Config } from './config.js';
import type { DatabaseService } from './database/services/database-service.js';
import type { ExerciseService } from './database/services/exercise-service.js';
import {
    deleteExercise,
    getExercise,
    getExerciseHistory,
    postExercise,
} from './http-handler/api/exercise.js';
import { getHealth } from './http-handler/api/health.js';
import { secureHttp } from './http-handler/secure-http.js';
import type { ExerciseManagerService } from './database/services/exercise-manager-service.js';
import { getExercises } from './http-handler/api/exercise-manager.js';

export class ApiHttpServer {
    public readonly httpServer: HttpServer;
    /**
     * @param uploadLimit in Megabyte can be set via ENV DFM_UPLOAD_LIMIT
     */
    public constructor(
        app: Express,
        databaseService: DatabaseService,
        exerciseService: ExerciseService,
        exerciseManagerService: ExerciseManagerService
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

        app.get('/api/exercises/', async (req, res) =>
            secureHttp(
                async () => getExercises(exerciseManagerService),
                req,
                res
            )
        );

        app.get('/api/exercise_templates/', async (req, res) =>
            secureHttp(
                () => {
                    const exercises = [
                        {
                            trainerId: '12345678',
                            lastExerciseCreatedAt: new Date(
                                '2025-12-07T16:42:02.718Z'
                            ),
                            name: 'MANV 25 mit Verkehrsunfall',
                            description:
                                'Diverse eingeklemmte Personen nach einem Busunfall',
                        },
                        {
                            trainerId: '78912345',
                            lastExerciseCreatedAt: new Date(
                                '2025-12-03T16:42:02.718Z'
                            ),
                            name: 'MANV 50 am Brandenburger Tor',
                            description:
                                'Viele leichtverletzte Personen nach einem Gedränge',
                        },
                    ];

                    return {
                        statusCode: 200,
                        body: exerciseTemplatesSchema.encode(exercises),
                    };
                },
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
