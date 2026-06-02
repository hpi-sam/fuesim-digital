import type {
    ExerciseType,
    ExerciseTemplateId,
    StateExport,
    ParticipantKey,
    TrainerKey,
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
import { AccessKeyRepository } from '../repositories/access-key-repository.js';
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
    ): Promise<ActiveExercise> {
        await this.exerciseService.saveUnsavedExercises();

        return this.exerciseRepository.transaction(async (tx) => {
            const accessKeyRepository = new AccessKeyRepository(tx);

            const exerciseTemplate =
                await tx.getExerciseTemplateById(templateId);
            if (!exerciseTemplate) {
                throw new NotFoundError();
            }
            if (session && exerciseTemplate.user !== session.user.id) {
                throw new PermissionDeniedError();
            }

            const participantKey =
                await accessKeyRepository.generateKey<ParticipantKey>(6);
            const trainerKey =
                await accessKeyRepository.generateKey<TrainerKey>(8);

            const initialState = {
                ...exerciseTemplate.exercise.currentStateString,
                participantKey,
                type,
            };
            const exerciseInsert = {
                ...optionalData,
                user: session ? session.user.id : null,
                trainerKey,
                participantKey,
                stateVersion: exerciseTemplate.exercise.stateVersion,
                initialStateString: initialState,
                currentStateString: initialState,
                baseTemplateId: exerciseTemplate.id,
            } satisfies ExerciseInsert;

            const exerciseEntry = await tx.createExercise(exerciseInsert);
            if (!exerciseEntry) throw new ApiError();

            const activeExercise = new ActiveExercise(exerciseEntry, []);
            this.exerciseService.loadExercise(activeExercise);

            await tx.updateExerciseTemplate(exerciseTemplate.id, {
                lastExerciseCreatedAt: new Date(),
            });
            return activeExercise;
        });
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
        const activeExercise = this.exerciseService.getExerciseByKey(
            exerciseTemplate.trainerKey,
            session
        );
        this.exerciseService.unloadExercise(activeExercise);

        await this.exerciseRepository.deleteExerciseTemplateById(
            exerciseTemplate.id
        );
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
            exerciseTemplate.exercise.id
        );
    }
}
