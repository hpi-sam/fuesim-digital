import {
    getExercisesResponseDataSchema,
    getExerciseTemplateResponseDataSchema,
    getExerciseTemplatesResponseDataSchema,
    postExerciseTemplateRequestDataSchema,
} from 'digital-fuesim-manv-shared';
import type { ExerciseManagerService } from '../database/services/exercise-manager-service.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import { HttpRouter } from '../http-router.js';
import type { AuthService } from '../auth/auth-service.js';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';

export class ExerciseManagerHttpRouter extends HttpRouter {
    public constructor(
        private readonly authService: AuthService,
        private readonly exerciseManagerService: ExerciseManagerService,
        private readonly exerciseService: ExerciseService
    ) {
        super();
    }

    protected initializeRoutes() {
        this.router.get(
            '/api/exercises/',
            isAuthenticatedMiddleware,
            async (req, res) => {
                const exercises =
                    await this.exerciseManagerService.getAllExercisesOfOwner(
                        req.session!
                    );

                res.send(getExercisesResponseDataSchema.encode(exercises));
            }
        );

        this.router.use('/api/exercise_templates/', isAuthenticatedMiddleware);

        this.router.get('/api/exercise_templates/', async (req, res) => {
            const templates =
                await this.exerciseManagerService.getAllExerciseTemplatesOfOwner(
                    req.session!
                );
            res.send(getExerciseTemplatesResponseDataSchema.encode(templates));
        });

        this.router.post('/api/exercise_templates/', async (req, res) => {
            const parsedData = postExerciseTemplateRequestDataSchema.parse(
                req.body
            );
            const exerciseTemplate =
                await this.exerciseManagerService.createExerciseTemplate(
                    parsedData,
                    req.session!,
                    this.exerciseService
                );

            res.send(
                getExerciseTemplateResponseDataSchema.encode(exerciseTemplate)
            );
        });

        this.router.post(
            '/api/exercise_templates/:id/new',
            async (req, res) => {
                const newExercise =
                    await this.exerciseManagerService.createExerciseFromTemplate(
                        req.params.id,
                        req.session!,
                        this.exerciseService
                    );

                res.status(201).send({
                    participantId: newExercise.participantKey,
                    trainerId: newExercise.trainerKey,
                });
            }
        );

        this.router.patch('/api/exercise_templates/:id', async (req, res) => {
            const parsedData = postExerciseTemplateRequestDataSchema.parse(
                req.body
            );

            const exerciseTemplate =
                await this.exerciseManagerService.updateExerciseTemplate(
                    req.params.id,
                    req.session!,
                    parsedData
                );
            res.status(201).send(
                getExerciseTemplateResponseDataSchema.encode(exerciseTemplate)
            );
        });

        this.router.delete('/api/exercise_templates/:id', async (req, res) => {
            await this.exerciseManagerService.deleteExerciseTemplate(
                req.params.id,
                req.session!,
                this.exerciseService
            );
            res.status(204).send();
        });
    }
}
