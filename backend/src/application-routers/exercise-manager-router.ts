import {
    exercisesSchema,
    exerciseTemplateCreateSchema,
    exerciseTemplateSchema,
    exerciseTemplatesSchema,
} from 'digital-fuesim-manv-shared';
import type { ExerciseManagerService } from '../database/services/exercise-manager-service.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import { HttpRouter } from '../http-router.js';
import type { AuthService } from '../auth/auth-service.js';
import { secureHttp } from '../utils/secure-http.js';
import { HealthHttpRouter } from '../health-router.js';

export class ExerciseManagerHttpRouter extends HttpRouter {
    public constructor(
        private readonly authService: AuthService,
        private readonly exerciseManagerService: ExerciseManagerService,
        private readonly exerciseService: ExerciseService
    ) {
        super();
    }

    protected initializeRoutes() {
        this.router.get('/api/exercises/', async (req, res) =>
            secureHttp(
                async () => {
                    const exercises =
                        await this.exerciseManagerService.getAllExercisesOfOwner();
                    return {
                        statusCode: 200,
                        body: exercisesSchema.encode(exercises),
                    };
                },
                req,
                res
            )
        );

        this.router.get('/api/exercise_templates/', async (req, res) =>
            secureHttp(
                async () => {
                    const templates =
                        await this.exerciseManagerService.getAllExerciseTemplatesOfOwner();
                    return {
                        statusCode: 200,
                        body: exerciseTemplatesSchema.encode(templates),
                    };
                },
                req,
                res
            )
        );
        this.router.post('/api/exercise_template/', async (req, res) =>
            secureHttp(
                async () => {
                    const parsedData = exerciseTemplateCreateSchema.parse(
                        req.body
                    );
                    const exerciseTemplate =
                        await this.exerciseManagerService.createExerciseTemplate(
                            parsedData,
                            this.exerciseService
                        );

                    return {
                        statusCode: 201,
                        body: exerciseTemplateSchema.encode(exerciseTemplate),
                    };
                },
                req,
                res
            )
        );
        this.router.post('/api/exercise_template/:id/new', async (req, res) =>
            secureHttp(
                async () => {
                    const newExercise =
                        await this.exerciseManagerService.createExerciseFromTemplate(
                            req.params.id,
                            this.exerciseService
                        );

                    return {
                        statusCode: 201,
                        body: {
                            participantId:
                                newExercise.getExercise().participantId,
                            trainerId: newExercise.getExercise().trainerId,
                        },
                    };
                },
                req,
                res
            )
        );
        this.router.patch('/api/exercise_template/:id', async (req, res) =>
            secureHttp(
                async () => {
                    const parsedData = exerciseTemplateCreateSchema.parse(
                        req.body
                    );

                    const exerciseTemplate =
                        await this.exerciseManagerService.patchExerciseTemplate(
                            req.params.id,
                            parsedData
                        );

                    return {
                        statusCode: 201,
                        body: exerciseTemplateSchema.encode(exerciseTemplate),
                    };
                },
                req,
                res
            )
        );
        this.router.delete('/api/exercise_template/:id', async (req, res) =>
            secureHttp(
                async () => {
                    await this.exerciseManagerService.deleteExerciseTemplate(
                        req.params.id,
                        this.exerciseService
                    );
                    return {
                        statusCode: 204,
                        body: undefined,
                    };
                },
                req,
                res
            )
        );
        this.router.use(new HealthHttpRouter().router);
    }
}
