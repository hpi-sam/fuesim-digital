import { exerciseExistsResponseDataSchema } from 'digital-fuesim-manv-shared';
import { isEmpty } from 'lodash-es';
import { Router } from 'express';
import { importExercise } from '../utils/import-exercise.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import { ExerciseFactory } from '../exercise/exercise-factory.js';
import { isExerciseKey } from '../exercise/exercise-keys.js';
import { ApiError } from '../utils/http.js';

export const createExerciseRouter = (
    exerciseService: ExerciseService
): Router => {
    const router = Router();
    router.post('/exercise', async (req, res) => {
        const exercise = isEmpty(req.body)
            ? ExerciseFactory.fromBlank()
            : importExercise(req.body);
        const optionalData = req.session
            ? { user: req.session.user.id }
            : undefined;
        await exerciseService.createExercise(exercise, optionalData);
        res.status(201).send({
            participantId: exercise.participantKey,
            trainerId: exercise.trainerKey,
        });
    });

    router.get('/exercise/:exerciseKey', async (req, res) => {
        if (!isExerciseKey(req.params.exerciseKey)) {
            throw new ApiError();
        }
        const exercise = exerciseService.getExerciseByKey(
            req.params.exerciseKey,
            req.session
        );
        res.send(
            exerciseExistsResponseDataSchema.parse({
                isTemplate: !!exercise.template,
            })
        );
    });

    router.delete('/exercise/:exerciseKey', async (req, res) => {
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
};
