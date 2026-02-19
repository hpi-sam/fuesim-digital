import { Router } from 'express';
import {
    getParallelExerciseResponseDataSchema,
    getParallelExercisesResponseDataSchema,
    postParallelExerciseRequestDataSchema,
    parallelExerciseIdSchema,
    groupParticipantKeySchema,
    postJoinParallelExerciseResponseDataSchema,
} from 'fuesim-digital-shared';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';
import { ApiError } from '../utils/http.js';
import type { ParallelExerciseService } from '../database/services/parallel-exercise-service.js';

export const createParallelExerciseRouter = (
    parallelExerciseService: ParallelExerciseService
): Router => {
    const router = Router();

    router
        .route('/')
        .all(isAuthenticatedMiddleware)
        .get(async (req, res) => {
            const parallelExercies =
                await parallelExerciseService.getParallelExercisesOfOwner(
                    req.session!
                );
            res.send(
                getParallelExercisesResponseDataSchema.encode(parallelExercies)
            );
        })
        .post(async (req, res) => {
            const parsedData = postParallelExerciseRequestDataSchema.parse(
                req.body
            );
            const parallelExercise =
                await parallelExerciseService.createParallelExercise(
                    parsedData,
                    req.session!
                );

            res.send(
                getParallelExerciseResponseDataSchema.encode(parallelExercise)
            );
        });

    router.post('/join/:key', async (req, res) => {
        const key = groupParticipantKeySchema.safeParse(req.params.key).data;
        if (!key) throw new ApiError();
        const exercise =
            await parallelExerciseService.joinParallelExerciseByParticipantKey(
                key
            );
        res.send(
            postJoinParallelExerciseResponseDataSchema.encode({
                participantKey: exercise.participantKey,
            })
        );
    });

    router
        .route('/:id')
        .get(async (req, res) => {
            const id = parallelExerciseIdSchema.safeParse(req.params.id).data;
            if (!id) throw new ApiError();

            const parallelExercise =
                await parallelExerciseService.getParallelExerciseById(
                    id,
                    req.session!
                );
            res.status(201).send(
                getParallelExerciseResponseDataSchema.encode(parallelExercise)
            );
        })
        .delete(async (req, res) => {
            const id = parallelExerciseIdSchema.safeParse(req.params.id).data;
            if (!id) throw new ApiError();

            await parallelExerciseService.deleteParallelExercise(
                id,
                req.session!
            );
            res.status(204).send();
        });

    return router;
};
