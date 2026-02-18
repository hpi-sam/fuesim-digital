import {
    getExercisesResponseDataSchema,
    getExerciseTemplateResponseDataSchema,
    getExerciseTemplatesResponseDataSchema,
    postExerciseTemplateRequestDataSchema,
    getExerciseTemplateViewportsResponseDataSchema,
    patchExerciseTemplateRequestDataSchema,
    exerciseTemplateIdSchema,
} from 'fuesim-digital-shared';
import { Router } from 'express';
import type { ExerciseManagerService } from '../database/services/exercise-manager-service.js';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';

export const createExerciseManagerRouter = (
    exerciseManagerService: ExerciseManagerService
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
                    req.session!
                );

            res.status(201).send(
                getExerciseTemplateResponseDataSchema.encode(exerciseTemplate)
            );
        });

    router
        .route('/exercise_templates/:id/new')
        .all(isAuthenticatedMiddleware)
        .post(async (req, res) => {
            const templateId = exerciseTemplateIdSchema.parse(req.params.id);
            const newExercise =
                await exerciseManagerService.createExerciseFromTemplate(
                    templateId,
                    req.session!
                );

            res.status(201).send({
                participantKey: newExercise.participantKey,
                trainerKey: newExercise.trainerKey,
            });
        });

    router.get('/exercise_templates/:id/viewports', async (req, res) => {
        const templateId = exerciseTemplateIdSchema.parse(req.params.id);
        const viewports =
            await exerciseManagerService.getExerciseTemplateViewportsById(
                templateId,
                req.session!
            );

        res.status(201).send(
            getExerciseTemplateViewportsResponseDataSchema.encode(viewports)
        );
    });

    router
        .route('/exercise_templates/:id')
        .all(isAuthenticatedMiddleware)
        .patch(async (req, res) => {
            const templateId = exerciseTemplateIdSchema.parse(req.params.id);

            const parsedData = patchExerciseTemplateRequestDataSchema.parse(
                req.body
            );

            const exerciseTemplate =
                await exerciseManagerService.updateExerciseTemplate(
                    templateId,
                    req.session!,
                    parsedData
                );
            res.send(
                getExerciseTemplateResponseDataSchema.encode(exerciseTemplate)
            );
        })
        .delete(async (req, res) => {
            const templateId = exerciseTemplateIdSchema.parse(req.params.id);

            await exerciseManagerService.deleteExerciseTemplate(
                templateId,
                req.session!
            );
            res.status(204).send();
        });
    return router;
};
