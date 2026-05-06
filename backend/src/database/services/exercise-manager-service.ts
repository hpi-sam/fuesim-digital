import type {
    ExerciseType,
    ExerciseTemplateId,
    StateExport,
} from 'fuesim-digital-shared';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
import type { SessionInformation } from '../../auth/auth-service.js';
import type { ExerciseInsert, ExerciseTemplateInsert } from '../schema.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import { ActiveExercise } from '../../exercise/active-exercise.js';
import type { ExerciseService } from './exercise-service.js';

export class ExerciseManagerService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly exerciseService: ExerciseService
    ) {}

    public async getAllExercisesOfOwner(session: SessionInformation) {
        return this.exerciseRepository.getAllExercisesOfOwner(session.user.id);
    }

    public async getAllExerciseTemplatesOfOwner(session: SessionInformation) {
        return this.exerciseRepository.getAllExerciseTemplatesOfOwner(
            session.user.id
        );
    }

    public async createExerciseTemplateFromBlank(
        data: Omit<ExerciseTemplateInsert, 'user'>,
        session: SessionInformation
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.createExerciseTemplate({
                ...data,
                user: session.user.id,
            });
        if (!exerciseTemplate) {
            throw new ApiError();
        }
        const newExercise = await this.exerciseService.createExerciseFromBlank({
            templateId: exerciseTemplate.id,
        });
        newExercise.template = exerciseTemplate;
        return {
            ...exerciseTemplate,
            trainerKey: newExercise.trainerKey,
        };
    }

    public async createExerciseTemplateFromFile(
        importObject: StateExport,
        session: SessionInformation
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.createExerciseTemplate({
                name: 'Importierte Datei',
                user: session.user.id,
            });
        if (!exerciseTemplate) {
            throw new ApiError();
        }
        const newExercise = await this.exerciseService.createExerciseFromFile(
            importObject,
            {
                templateId: exerciseTemplate.id,
            }
        );
        newExercise.template = exerciseTemplate;
        return {
            ...exerciseTemplate,
            trainerKey: newExercise.trainerKey,
        };
    }

    public async updateExerciseTemplate(
        id: ExerciseTemplateId,
        session: SessionInformation,
        data: Partial<ExerciseTemplateInsert>
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(id);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        if (exerciseTemplate.user !== session.user.id) {
            throw new PermissionDeniedError();
        }
        const updatedTemplate =
            await this.exerciseRepository.updateExerciseTemplate(
                exerciseTemplate.id,
                data
            );
        if (!updatedTemplate) {
            throw new ApiError();
        }
        const exercise = this.exerciseService.getExerciseByKey(
            exerciseTemplate.trainerKey,
            session
        );
        exercise.template = updatedTemplate;
        return {
            ...updatedTemplate,
            trainerKey: exerciseTemplate.trainerKey,
        };
    }

    public async createExerciseFromTemplate(
        templateId: ExerciseTemplateId,
        type: ExerciseType = 'standalone',
        session?: SessionInformation,
        optionalData?: Partial<Omit<ExerciseInsert, 'baseTemplateId' | 'user'>>
    ) {
        await this.exerciseService.saveUnsavedExercises();

        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(templateId);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        if (session && exerciseTemplate.user !== session.user.id) {
            throw new PermissionDeniedError();
        }

        const exerciseKeys = await this.exerciseService.createKeys();
        const stateString = {
            ...exerciseTemplate.exercise.currentStateString,
            participantKey: exerciseKeys.participantKey,
            type,
        };
        const newExerciseEntry = {
            ...optionalData,
            user: session ? session.user.id : null,
            ...exerciseKeys,
            stateVersion: exerciseTemplate.exercise.stateVersion,
            initialStateString: stateString,
            currentStateString: stateString,
            baseTemplateId: exerciseTemplate.id,
        };
        const newExercise =
            await this.exerciseService.createExercise(newExerciseEntry);
        const activeExercise = new ActiveExercise(newExercise, []);
        await this.exerciseRepository.updateExerciseTemplate(
            exerciseTemplate.id,
            { lastExerciseCreatedAt: new Date() }
        );
        return activeExercise;
    }

    public async deleteExerciseTemplate(
        id: ExerciseTemplateId,
        session: SessionInformation
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(id);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        if (exerciseTemplate.user !== session.user.id) {
            throw new PermissionDeniedError();
        }
        const activeExercise = await this.exerciseService.getExerciseByKey(
            exerciseTemplate.trainerKey,
            session
        );
        this.exerciseService.unloadExercise(activeExercise);

        await this.exerciseRepository.deleteExerciseTemplateById(
            exerciseTemplate.id
        );
        await this.exerciseService.freeExerciseKeys(activeExercise);
    }

    public async getExerciseTemplateViewportsById(
        id: ExerciseTemplateId,
        session: SessionInformation
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(id);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        if (exerciseTemplate.user !== session.user.id) {
            throw new PermissionDeniedError();
        }
        return this.exerciseService.getExercisesViewportsById(
            exerciseTemplate.exercise.id,
            session
        );
    }
}
