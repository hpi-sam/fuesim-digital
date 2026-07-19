import type {
    ExerciseType,
    ExerciseTemplateId,
    ExerciseState,
    StateExport,
    ParticipantKey,
    TrainerKey,
    OrganisationId,
} from 'fuesim-digital-shared';
import { ZipArchive } from 'archiver';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
import type { SessionInformation } from '../../auth/auth-service.js';
import {
    type ExerciseEntry,
    type ExerciseInsert,
    type ExerciseTemplateDetailsEntryWithUserRole,
    type ExerciseTemplateInsert,
} from '../schema.js';
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

    public async getAllExerciseTemplatesForUser(
        session: SessionInformation,
        organisationId?: OrganisationId
    ): Promise<ExerciseTemplateDetailsEntryWithUserRole[]> {
        if (organisationId) {
            const organisation =
                await this.organisationRepository.getOrganisationById(
                    organisationId
                );
            if (!organisation) {
                throw new PermissionDeniedError();
            }
            const userRole =
                await this.organisationRepository.getOrganisationMembershipRoleForUserById(
                    organisationId,
                    session.user.id
                );
            if (!userRole) {
                throw new PermissionDeniedError();
            }
            return (
                await this.exerciseRepository.getAllExerciseTemplatesForOrganisation(
                    organisationId
                )
            ).map((template) => ({
                ...template,
                userRole,
            }));
        }
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
        optionalData?: Partial<Omit<ExerciseInsert, 'baseTemplateId' | 'user'>>,
        initialStateOverride?: ExerciseState
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
                !(await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                    exerciseTemplate.organisationId,
                    session.user.id,
                    ['editor', 'admin']
                ));
            if (isNotMember) {
                throw new PermissionDeniedError();
            }

            const participantKey =
                await accessKeyRepository.generateKey<ParticipantKey>(6);
            const trainerKey =
                await accessKeyRepository.generateKey<TrainerKey>(8);

            const initialState = {
                ...(initialStateOverride ??
                    exerciseTemplate.exercise.currentStateString),
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

    public async buildExercisesArchive(
        exercises: ExerciseEntry[],
        session?: SessionInformation
    ) {
        const archive = new ZipArchive();
        for (const exercise of exercises) {
            // eslint-disable-next-line no-await-in-loop
            const stateExport = await this.exerciseService.getExport(
                exercise.trainerKey,
                true,
                session
            );
            const buffer = Buffer.from(JSON.stringify(stateExport));
            archive.append(buffer, {
                name: `exercise-state-${exercise.participantKey}.json`,
            });
        }
        await archive.finalize();
        return archive;
    }

    public async exportAllExercisesForOrganisation(
        organisationId: OrganisationId,
        session: SessionInformation
    ) {
        const organisation =
            await this.organisationRepository.getOrganisationById(
                organisationId
            );
        if (!organisation) {
            throw new NotFoundError();
        }
        const isMember =
            await this.organisationRepository.isMemberOfOrganisationById(
                organisationId,
                session.user.id
            );
        if (!isMember) {
            throw new PermissionDeniedError();
        }

        const exercises =
            await this.exerciseRepository.getAllExercisesForOrganisation(
                organisationId
            );
        return this.buildExercisesArchive(exercises, session);
    }

    public async exportAllExerciseTemplatesForOrganisation(
        organisationId: OrganisationId,
        session: SessionInformation
    ) {
        const organisation =
            await this.organisationRepository.getOrganisationById(
                organisationId
            );
        if (!organisation) {
            throw new NotFoundError();
        }
        const isMember =
            await this.organisationRepository.isMemberOfOrganisationById(
                organisationId,
                session.user.id
            );
        if (!isMember) {
            throw new PermissionDeniedError();
        }

        const exercises = (
            await this.exerciseRepository.getAllExerciseTemplatesForOrganisation(
                organisationId
            )
        ).map((exerciseTemplate) => exerciseTemplate.exercise);
        return this.buildExercisesArchive(exercises, session);
    }
}
