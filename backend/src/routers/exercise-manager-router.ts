import {
    getExercisesResponseDataSchema,
    getExerciseTemplateResponseDataSchema,
    getExerciseTemplatesResponseDataSchema,
    postExerciseTemplateRequestDataSchema,
} from 'fuesim-digital-shared';
import { Router } from 'express';
import type { ExerciseManagerService } from '../database/services/exercise-manager-service.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';
import { exerciseTemplateIdSchema } from '../database/schema.js';
import { ApiError } from '../utils/http.js';

export const createExerciseManagerRouter = (
    exerciseManagerService: ExerciseManagerService,
    exerciseService: ExerciseService
): Router => {
    const router = Router();

    router.get('/exercises/', isAuthenticatedMiddleware, async (req, res) => {
        const exercises = await exerciseManagerService.getAllExercisesOfOwner(
            req.session!
        );

        res.send(getExercisesResponseDataSchema.encode(exercises));
    });

    router
        .route('/exercise_templates/')
        .all(isAuthenticatedMiddleware)
        .get(async (req, res) => {
            const templates =
                await exerciseManagerService.getAllExerciseTemplatesOfOwner(
                    req.session!
                );
            res.send(getExerciseTemplatesResponseDataSchema.encode(templates));
        })
        .post(async (req, res) => {
            const parsedData = postExerciseTemplateRequestDataSchema.parse(
                req.body
            );
            const exerciseTemplate =
                await exerciseManagerService.createExerciseTemplate(
                    parsedData,
                    req.session!,
                    exerciseService
                );

            res.send(
                getExerciseTemplateResponseDataSchema.encode(exerciseTemplate)
            );
        });

    router.post('/exercise_templates/:id/new', async (req, res) => {
        const templateId = exerciseTemplateIdSchema.safeParse(
            req.params.id
        ).data;
        if (!templateId) throw new ApiError();
        const newExercise =
            await exerciseManagerService.createExerciseFromTemplate(
                templateId,
                req.session!,
                exerciseService
            );

        res.status(201).send({
            participantKey: newExercise.participantKey,
            trainerKey: newExercise.trainerKey,
        });
    });

    router.patch('/exercise_templates/:id', async (req, res) => {
        const templateId = exerciseTemplateIdSchema.safeParse(
            req.params.id
        ).data;
        if (!templateId) throw new ApiError();

        const parsedData = postExerciseTemplateRequestDataSchema.parse(
            req.body
        );

        const exerciseTemplate =
            await exerciseManagerService.updateExerciseTemplate(
                templateId,
                req.session!,
                parsedData
            );
        res.status(201).send(
            getExerciseTemplateResponseDataSchema.encode(exerciseTemplate)
        );
    });

    router.delete('/exercise_templates/:id', async (req, res) => {
        const templateId = exerciseTemplateIdSchema.safeParse(
            req.params.id
        ).data;
        if (!templateId) throw new ApiError();

        await exerciseManagerService.deleteExerciseTemplate(
            templateId,
            req.session!,
            exerciseService
        );
        res.status(204).send();
    });
    return router;
};
