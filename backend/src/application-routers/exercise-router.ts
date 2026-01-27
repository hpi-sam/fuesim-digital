import {
    exerciseExistsSchema,
    NotFoundError,
    PermissionDeniedError,
} from 'digital-fuesim-manv-shared';
import { isEmpty } from 'lodash-es';
import { importExercise } from '../utils/import-exercise.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import { ExerciseFactory } from '../exercise/exercise-factory.js';
import { HttpRouter } from '../http-router.js';
import type { AuthService } from '../auth/auth-service.js';

export class ExerciseHttpRouter extends HttpRouter {
    public constructor(
        private readonly authService: AuthService,
        private readonly exerciseService: ExerciseService
    ) {
        super();
    }

    protected initializeRoutes() {
        this.router.post('/api/exercise', async (req, res) => {
            const exercise = isEmpty(req.body)
                ? ExerciseFactory.fromBlank()
                : importExercise(req.body);
            const optionalData = req.session
                ? { user: req.session.user.id }
                : undefined;
            await this.exerciseService.createExercise(exercise, optionalData);
            res.status(201).send({
                participantId: exercise.getExercise().participantId,
                trainerId: exercise.getExercise().trainerId,
            });
        });

        this.router.get('/api/exercise/:exerciseId', async (req, res) => {
            const exercise = this.exerciseService.getExerciseByKey(
                req.params.exerciseId
            );
            if (!exercise) throw new NotFoundError();
            res.send(
                exerciseExistsSchema.parse({
                    isTemplate: !!exercise.template,
                })
            );
        });

        this.router.delete('/api/exercise/:exerciseId', async (req, res) => {
            if (
                this.exerciseService.getRoleFromId(req.params.exerciseId) !==
                'trainer'
            ) {
                throw new PermissionDeniedError();
            }
            await this.exerciseService.deleteExercise(req.params.exerciseId);

            res.status(204).send();
        });

        this.router.get(
            '/api/exercise/:exerciseId/history',
            async (req, res) => {
                const timeline = await this.exerciseService.getTimeline(
                    req.params.exerciseId
                );
                if (!timeline) throw new NotFoundError();
                res.send(timeline);
            }
        );
    }
}
