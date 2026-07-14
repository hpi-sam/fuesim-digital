import {
    exerciseExistsResponseDataSchema,
    getExerciseConfigResponseDataSchema,
    getExerciseResponseDataSchema,
    getExercisesResponseDataSchema,
    isExerciseKey,
    isTrainerKey,
    organisationIdSchema,
    postExerciseRequestDataSchema,
} from 'fuesim-digital-shared';
import { Router } from 'express';
import type { ExerciseService } from '../database/services/exercise-service.js';
import { ApiError, NotFoundError } from '../utils/http.js';
import { Config } from '../config.js';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';

export function createExerciseRouter(exerciseService: ExerciseService): Router {
    const router = Router();

    router.route('/config').get(async (req, res) => {
        res.send(
            getExerciseConfigResponseDataSchema.encode({
                parallelExercisesEnabled: Config.parallelExercisesEnabled,
                autoDeleteDays: Config.autoDeleteDays,
            })
        );
    });

    router.get('/exercises/', isAuthenticatedMiddleware, async (req, res) => {
        const orgIdRes = organisationIdSchema.safeParse(
            req.query['organisationId']
        );
        const exercises = await exerciseService.getAllExercisesForUser(
            req.session!,
            orgIdRes.success ? orgIdRes.data : undefined
        );

        res.send(getExercisesResponseDataSchema.encode(exercises));
    });

    router.post('/exercise', async (req, res) => {
        const data = postExerciseRequestDataSchema.parse(req.body);
        const exercise = await exerciseService.createExercise(
            data,
            req.session
        );

        res.status(201).send(
            getExerciseResponseDataSchema.encode(exercise.exercise)
        );
    });

    router
        .route('/exercise/:exerciseKey')
        .get(async (req, res) => {
            if (!isExerciseKey(req.params.exerciseKey)) {
                throw new ApiError();
            }
            let exercise = null;
            try {
                exercise = await exerciseService.getExerciseByKey(
                    req.params.exerciseKey,
                    req.session
                );
            } catch (error: unknown) {
                if (!(error instanceof NotFoundError)) {
                    throw error;
                }
            }
            const autojoin = exercise
                ? !!exercise.exercise.templateId ||
                  (!!exercise.exercise.parallelExerciseId &&
                      isTrainerKey(req.params.exerciseKey))
                : undefined;
            res.send(
                exerciseExistsResponseDataSchema.encode({
                    exists: exercise !== null,
                    autojoin,
                })
            );
        })
        .delete(async (req, res) => {
            if (!isExerciseKey(req.params.exerciseKey)) {
                throw new ApiError();
            }
            await exerciseService.deleteExercise(
                req.params.exerciseKey,
                req.session
            );
            res.status(204).send();
        });

    router.get('/exercise/:exerciseKey/history', async (req, res) => {
        if (!isExerciseKey(req.params.exerciseKey)) {
            throw new ApiError();
        }
        const timeline = await exerciseService.getTimeline(
            req.params.exerciseKey,
            req.session
        );
        res.send(timeline);
    });

    return router;
}
