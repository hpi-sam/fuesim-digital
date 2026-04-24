import { type RequestHandler, Router } from 'express';
import {
    getParallelExerciseResponseDataSchema,
    getParallelExercisesResponseDataSchema,
    postParallelExerciseRequestDataSchema,
    parallelExerciseIdSchema,
    postJoinParallelExerciseResponseDataSchema,
    patchParallelExerciseRequestDataSchema,
    isGroupParticipantKey,
    exerciseExistsResponseDataSchema,
} from 'fuesim-digital-shared';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../utils/http.js';
import type { ParallelExerciseService } from '../database/services/parallel-exercise-service.js';
import { Config } from '../config.js';

export const areParallelExercisesEnabled: RequestHandler = (req, res, next) => {
    if (!Config.parallelExercisesEnabled) {
        throw new PermissionDeniedError();
    }
    next();
};

export function createParallelExerciseRouter(
    parallelExerciseService: ParallelExerciseService
): Router {
    const router = Router();

    router
        .route('/')
        .all(areParallelExercisesEnabled, isAuthenticatedMiddleware)
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

            res.status(201).send(
                getParallelExerciseResponseDataSchema.encode(parallelExercise)
            );
        });

    router.route('/enabled').get(async (req, res) => {
        res.send(Config.parallelExercisesEnabled);
    });
    router
        .route('/join/:key')
        .all(areParallelExercisesEnabled)
        .get(async (req, res) => {
            if (!isGroupParticipantKey(req.params.key)) {
                throw new ApiError();
            }
            let exercise = null;
            try {
                exercise =
                    await parallelExerciseService.getParallelExerciseByParticipantKey(
                        req.params.key
                    );
            } catch (error: unknown) {
                if (!(error instanceof NotFoundError)) {
                    throw error;
                }
            }
            res.send(
                exerciseExistsResponseDataSchema.encode({
                    exists: exercise !== null,
                })
            );
        })
        .post(async (req, res) => {
            if (!isGroupParticipantKey(req.params.key)) throw new ApiError();
            const exercise =
                await parallelExerciseService.joinParallelExerciseByParticipantKey(
                    req.params.key
                );
            res.status(201).send(
                postJoinParallelExerciseResponseDataSchema.encode({
                    participantKey: exercise.participantKey,
                })
            );
        });

    router
        .route('/:id')
        .all(areParallelExercisesEnabled, isAuthenticatedMiddleware)
        .get(async (req, res) => {
            const id = parallelExerciseIdSchema.safeParse(req.params.id).data;
            if (!id) throw new ApiError();

            const parallelExercise =
                await parallelExerciseService.getParallelExerciseById(
                    id,
                    req.session!
                );
            res.send(
                getParallelExerciseResponseDataSchema.encode(parallelExercise)
            );
        })
        .patch(async (req, res) => {
            const id = parallelExerciseIdSchema.parse(req.params.id);

            const parsedData = patchParallelExerciseRequestDataSchema.parse(
                req.body
            );

            const parallelExercise =
                await parallelExerciseService.updateParallelExercise(
                    id,
                    req.session!,
                    parsedData
                );
            res.send(
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
}
