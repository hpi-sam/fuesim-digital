import type { OrganisationId } from 'fuesim-digital-shared';
import type { SessionInformation } from '../../auth/auth-service.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import type { OrganisationRepository } from '../repositories/organisation-repository.js';
import type { OrganisationInsert } from '../schema.js';

export class OrganisationService {
    public constructor(
        private readonly organisationRepository: OrganisationRepository
    ) {}

    public async getOrganisationsForUser(session: SessionInformation) {
        return this.organisationRepository.getOrganisationsForUser(
            session.user.id
        );
    }

    public async createOrganisation(
        data: OrganisationInsert,
        session: SessionInformation
    ) {
        const organisation =
            await this.organisationRepository.createOrganisation(data);
        if (!organisation) {
            throw new ApiError();
        }
        await this.organisationRepository.addMemberToOrganisation(
            organisation.id,
            session.user.id,
            'admin'
        );
        return organisation;
    }

    public async getOrganisationDetailsById(
        id: OrganisationId,
        session: SessionInformation
    ) {
        const organisation =
            await this.organisationRepository.getOrganisationById(id);
        if (!organisation) {
            throw new NotFoundError();
        }
        if (
            !(await this.organisationRepository.isMemberOfOrganisationById(
                id,
                session.user.id
            ))
        ) {
            throw new PermissionDeniedError();
        }
        const members =
            await this.organisationRepository.getOrganisationMembersById(id);
        const userRole =
            await this.organisationRepository.getOrganisationMembershipRoleForUserById(
                id,
                session.user.id
            );
        return { ...organisation, userRole, members };
    }

    public async updateOrganisation(
        id: OrganisationId,
        session: SessionInformation,
        data: Partial<OrganisationInsert>
    ) {
        let organisation =
            await this.organisationRepository.getOrganisationById(id);
        if (!organisation) {
            throw new NotFoundError();
        }
        if (
            !(await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                id,
                session.user.id,
                ['admin']
            ))
        ) {
            throw new PermissionDeniedError();
        }
        organisation = await this.organisationRepository.updateOrganisation(
            organisation.id,
            data
        );
        if (!organisation) {
            throw new NotFoundError();
        }
        return organisation;
    }
}
