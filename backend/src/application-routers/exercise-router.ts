import { exerciseExistsSchema } from 'digital-fuesim-manv-shared';
import { isEmpty } from 'lodash-es';
import { ActiveExercise } from '../exercise/active-exercise.js';
import { importExercise } from '../utils/import-exercise.js';
import { UnknownExerciseError } from '../database/services/exercise-service.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import { ExerciseFactory } from '../exercise/exercise-factory.js';
import { HttpRouter } from '../http-router.js';
import type { AuthService } from '../auth/auth-service.js';
import { secureHttp } from '../utils/secure-http.js';

export class ExerciseHttpRouter extends HttpRouter {
    public constructor(
        private readonly authService: AuthService,
        private readonly exerciseService: ExerciseService
    ) {
        super();
    }

    protected initializeRoutes() {
        this.router.post('/api/exercise', async (req, res) =>
            secureHttp(
                async () => {
                    try {
                        const newExerciseOrError = isEmpty(req.body)
                            ? ExerciseFactory.fromBlank()
                            : importExercise(req.body);
                        if (!(newExerciseOrError instanceof ActiveExercise)) {
                            return newExerciseOrError;
                        }

                        await this.exerciseService.loadExercise(
                            newExerciseOrError
                        );

                        return {
                            statusCode: 201,
                            body: {
                                participantId:
                                    newExerciseOrError.getExercise()
                                        .participantId,
                                trainerId:
                                    newExerciseOrError.getExercise().trainerId,
                            },
                        };
                    } catch (error: unknown) {
                        if (error instanceof RangeError) {
                            return {
                                statusCode: 503,
                                body: {
                                    message: 'No ids available.',
                                },
                            };
                        }
                        throw error;
                    }
                },
                req,
                res
            )
        );
        this.router.get('/api/exercise/:exerciseId', async (req, res) =>
            secureHttp(
                () => {
                    const exercise = this.exerciseService.getExerciseByKey(
                        req.params.exerciseId
                    );
                    return {
                        statusCode: exercise ? 200 : 404,
                        body: exercise
                            ? exerciseExistsSchema.parse({
                                  isTemplate: !!exercise.template,
                              })
                            : undefined,
                    };
                },
                req,
                res
            )
        );
        this.router.delete('/api/exercise/:exerciseId', async (req, res) =>
            secureHttp(
                async () => {
                    if (
                        this.exerciseService.getRoleFromId(
                            req.params.exerciseId
                        ) !== 'trainer'
                    ) {
                        return {
                            statusCode: 403,
                            body: {
                                message:
                                    'Exercises can only be deleted by using their trainer id',
                            },
                        };
                    }
                    try {
                        await this.exerciseService.deleteExercise(
                            req.params.exerciseId
                        );
                        return {
                            statusCode: 204,
                            body: undefined,
                        };
                    } catch (err) {
                        if (err instanceof UnknownExerciseError) {
                            return {
                                statusCode: 404,
                                body: {
                                    message: `Exercise with id '${req.params.exerciseId}' was not found`,
                                },
                            };
                        }

                        throw err;
                    }
                },
                req,
                res
            )
        );
        this.router.get('/api/exercise/:exerciseId/history', async (req, res) =>
            secureHttp(
                async () => {
                    try {
                        const timeline = await this.exerciseService.getTimeline(
                            req.params.exerciseId
                        );
                        return {
                            statusCode: 200,
                            body: timeline,
                        };
                    } catch (err) {
                        if (err instanceof UnknownExerciseError) {
                            return {
                                statusCode: 404,
                                body: {
                                    message: `Exercise with id '${req.params.exerciseId}' was not found`,
                                },
                            };
                        }
                        throw err;
                    }
                },
                req,
                res
            )
        );
    }
}
