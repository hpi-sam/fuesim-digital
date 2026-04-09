import {
    exerciseExistsResponseDataSchema,
    isExerciseKey,
    isTrainerKey,
} from 'fuesim-digital-shared';
import { isEmpty } from 'lodash-es';
import { Router } from 'express';
import { importExercise } from '../utils/import-exercise.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import { ApiError } from '../utils/http.js';

export function createExerciseRouter(exerciseService: ExerciseService): Router {
    const router = Router();

    router.post('/exercise', async (req, res) => {
        const optionalData = req.session
            ? { user: req.session.user.id }
            : undefined;
        const exercise = isEmpty(req.body)
            ? await exerciseService.exerciseFactory.fromBlank(optionalData)
            : await importExercise(
                  req.body,
                  exerciseService.exerciseFactory,
                  optionalData
              );
        await exerciseService.loadExercise(exercise);

        res.status(201).send({
            participantKey: exercise.participantKey,
            trainerKey: exercise.trainerKey,
        });
    });

    router
        .route('/exercise/:exerciseKey')
        .get(async (req, res) => {
            if (!isExerciseKey(req.params.exerciseKey)) {
                throw new ApiError();
            }
            const exercise = exerciseService.getExerciseByKey(
                req.params.exerciseKey,
                req.session
            );
            res.send(
                exerciseExistsResponseDataSchema.encode({
                    autojoin:
                        !!exercise.exercise.templateId ||
                        (!!exercise.exercise.parallelExerciseId &&
                            isTrainerKey(req.params.exerciseKey)),
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
            req.params.exerciseKey
        );
        res.send(timeline);
    });

    return router;
}
