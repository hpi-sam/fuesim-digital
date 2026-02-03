import { ApiError, exerciseExistsSchema } from 'digital-fuesim-manv-shared';
import { isEmpty } from 'lodash-es';
import { importExercise } from '../utils/import-exercise.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import { ExerciseFactory } from '../exercise/exercise-factory.js';
import { HttpRouter } from '../http-router.js';
import type { AuthService } from '../auth/auth-service.js';
import { isExerciseKey } from '../exercise/exercise-keys.js';

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
                participantId: exercise.participantKey,
                trainerId: exercise.trainerKey,
            });
        });

        this.router.get('/api/exercise/:exerciseKey', async (req, res) => {
            if (!isExerciseKey(req.params.exerciseKey)) {
                throw new ApiError();
            }
            const exercise =
                await this.exerciseService.getExerciseByKeyProtected(
                    req.params.exerciseKey,
                    req.session
                );
            res.send(
                exerciseExistsSchema.parse({
                    isTemplate: !!exercise.template,
                })
            );
        });

        this.router.delete('/api/exercise/:exerciseKey', async (req, res) => {
            if (!isExerciseKey(req.params.exerciseKey)) {
                throw new ApiError();
            }
            await this.exerciseService.deleteExercise(
                req.params.exerciseKey,
                req.session
            );
            res.status(204).send();
        });

        this.router.get(
            '/api/exercise/:exerciseKey/history',
            async (req, res) => {
                if (!isExerciseKey(req.params.exerciseKey)) {
                    throw new ApiError();
                }
                const timeline = await this.exerciseService.getTimeline(
                    req.params.exerciseKey
                );
                res.send(timeline);
            }
        );
    }
}
