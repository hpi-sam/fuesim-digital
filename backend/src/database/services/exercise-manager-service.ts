import type {
    ExerciseType,
    ExerciseTemplateId,
    StateExport,
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
import type { ExerciseService } from './exercise-service.js';

export class ExerciseManagerService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly exerciseService: ExerciseService,
        private readonly organisationRepository: OrganisationRepository
    ) {}

    public async getAllExercisesOfOwner(session: SessionInformation) {
        return this.exerciseRepository.getAllExercisesOfOwner(session.user.id);
    }

    public async getAllExerciseTemplatesForUser(session: SessionInformation) {
        return this.exerciseRepository.getAllExerciseTemplatesForUser(
            session.user.id
        );
    }

    public async createExerciseTemplateFromBlank(
        data: Omit<ExerciseTemplateInsert, 'user'>,
        session: SessionInformation
    ) {
        if (
            !(await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                data.organisationId,
                session.user.id,
                ['editor', 'admin']
            ))
        ) {
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
        if (
            !(await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                exerciseTemplate.organisationId,
                session.user.id,
                ['editor', 'admin']
            ))
        ) {
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
    ) {
        await this.exerciseService.saveUnsavedExercises();

        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(templateId);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        if (
            session &&
            !(await this.organisationRepository.isMemberOfOrganisationById(
                exerciseTemplate.organisationId,
                session.user.id
            ))
        ) {
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
        await this.exerciseService.loadExercise(activeExercise);
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
        if (
            !(await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                exerciseTemplate.organisationId,
                session.user.id,
                ['editor', 'admin']
            ))
        ) {
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
        if (
            !(await this.organisationRepository.isMemberOfOrganisationById(
                exerciseTemplate.organisationId,
                session.user.id
            ))
        ) {
            throw new PermissionDeniedError();
        }
        return this.exerciseService.getExercisesViewportsById(
            exerciseTemplate.exercise.id
        );
    }
}
