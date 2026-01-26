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

export class ExerciseManagerHttpRouter extends HttpRouter {
    public constructor(
        private readonly authService: AuthService,
        private readonly exerciseManagerService: ExerciseManagerService,
        private readonly exerciseService: ExerciseService
    ) {
        super();
    }

    protected initializeRoutes() {
        this.router.get('/api/exercises/', async (req, res) => {
            const exercises =
                await this.exerciseManagerService.getAllExercisesOfOwner();

            res.send(exercisesSchema.encode(exercises));
        });

        this.router.get('/api/exercise_templates/', async (req, res) => {
            const templates =
                await this.exerciseManagerService.getAllExerciseTemplatesOfOwner();
            res.send(exerciseTemplatesSchema.encode(templates));
        });

        this.router.post('/api/exercise_template/', async (req, res) => {
            const parsedData = exerciseTemplateCreateSchema.parse(req.body);
            const exerciseTemplate =
                await this.exerciseManagerService.createExerciseTemplate(
                    parsedData,
                    this.exerciseService
                );

            res.send(exerciseTemplateSchema.encode(exerciseTemplate));
        });

        this.router.post('/api/exercise_template/:id/new', async (req, res) => {
            const newExercise =
                await this.exerciseManagerService.createExerciseFromTemplate(
                    req.params.id,
                    this.exerciseService
                );

            res.status(201).send({
                participantId: newExercise.getExercise().participantId,
                trainerId: newExercise.getExercise().trainerId,
            });
        });

        this.router.patch('/api/exercise_template/:id', async (req, res) => {
            const parsedData = exerciseTemplateCreateSchema.parse(req.body);

            const exerciseTemplate =
                await this.exerciseManagerService.patchExerciseTemplate(
                    req.params.id,
                    parsedData
                );
            res.status(201).send(
                exerciseTemplateSchema.encode(exerciseTemplate)
            );
        });

        this.router.delete('/api/exercise_template/:id', async (req, res) => {
            await this.exerciseManagerService.deleteExerciseTemplate(
                req.params.id,
                this.exerciseService
            );
            res.status(204).send();
        });
    }
}
