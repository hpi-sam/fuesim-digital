import { Router } from 'express';
import {
    getParallelExerciseResponseDataSchema,
    getParallelExercisesResponseDataSchema,
    postParallelExerciseRequestDataSchema,
    parallelExerciseIdSchema,
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
            const templates =
                await parallelExerciseService.getParallelExercisesOfOwner(
                    req.session!
                );
            res.send(getParallelExercisesResponseDataSchema.encode(templates));
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

    router
        .get('/:id', async (req, res) => {
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
        .delete('/:id', async (req, res) => {
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
