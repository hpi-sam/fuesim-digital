import type {
    ExerciseType,
    ExerciseTemplateId,
    StateExport,
    ParticipantKey,
    TrainerKey,
} from 'fuesim-digital-shared';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
import type { SessionInformation } from '../../auth/auth-service.js';
import { type ExerciseInsert, type ExerciseTemplateInsert } from '../schema.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import { ActiveExercise } from '../../exercise/active-exercise.js';
import type { OrganisationRepository } from '../repositories/organisation-repository.js';
import { AccessKeyRepository } from '../repositories/access-key-repository.js';
import type { ExerciseService } from './exercise-service.js';

export class ExerciseManagerService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly exerciseService: ExerciseService,
        private readonly organisationRepository: OrganisationRepository
    ) {}

    public async getAllExerciseTemplatesForUser(session: SessionInformation) {
        return this.exerciseRepository.getAllExerciseTemplatesForUser(
            session.user.id
        );
    }

    public async getExerciseTemplateById(
        id: ExerciseTemplateId,
        session: SessionInformation
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(id);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        const isMember =
            await this.organisationRepository.isMemberOfOrganisationById(
                exerciseTemplate.organisation.id,
                session.user.id
            );
        if (!isMember) {
            throw new PermissionDeniedError();
        }
        return exerciseTemplate;
    }

    public async createExerciseTemplateFromBlank(
        data: ExerciseTemplateInsert,
        session: SessionInformation
    ) {
        const isEditorOrAdmin =
            await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                data.organisationId,
                session.user.id,
                ['editor', 'admin']
            );
        if (!isEditorOrAdmin) {
            throw new PermissionDeniedError();
        }

        const exerciseTemplate =
            await this.exerciseRepository.createExerciseTemplate(data);
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
        data: ExerciseTemplateInsert,
        importObject: StateExport,
        session: SessionInformation
    ) {
        const isEditorOrAdmin =
            await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                data.organisationId,
                session.user.id,
                ['editor', 'admin']
            );
        if (!isEditorOrAdmin) {
            throw new PermissionDeniedError();
        }

        const exerciseTemplate =
            await this.exerciseRepository.createExerciseTemplate(data);
        if (!exerciseTemplate) {
            throw new ApiError();
        }
        const newExercise = await this.exerciseService.createExerciseFromFile(
            {
                templateId: exerciseTemplate.id,
            },
            importObject
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

        const isEditorOrAdmin =
            await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                exerciseTemplate.organisationId,
                session.user.id,
                ['editor', 'admin']
            );
        if (!isEditorOrAdmin) {
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
        return updatedTemplate;
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

            const isNotMember =
                session &&
                !(await this.organisationRepository.isMemberOfOrganisationById(
                    exerciseTemplate.organisationId,
                    session.user.id
                ));
            if (isNotMember) {
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
                organisationId: session
                    ? exerciseTemplate.organisationId
                    : null,
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

        const isEditorOrAdmin =
            await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                exerciseTemplate.organisationId,
                session.user.id,
                ['editor', 'admin']
            );
        if (!isEditorOrAdmin) {
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

        const isMember =
            await this.organisationRepository.isMemberOfOrganisationById(
                exerciseTemplate.organisationId,
                session.user.id
            );
        if (!isMember) {
            throw new PermissionDeniedError();
        }

        return this.exerciseService.getExercisesViewportsById(
            exerciseTemplate.exercise.id
        );
    }
}
