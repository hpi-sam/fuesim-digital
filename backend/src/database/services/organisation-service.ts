import type {
    OrganisationId,
    OrganisationMembershipId,
    OrganisationMembershipRole,
} from 'fuesim-digital-shared';
import type { SessionInformation } from '../../auth/auth-service.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import type { OrganisationRepository } from '../repositories/organisation-repository.js';
import type { OrganisationInsert } from '../schema.js';
import { Config } from '../../config.js';

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

    public async createOrganisationInviteLink(
        id: OrganisationId,
        session: SessionInformation
    ) {
        const organisation =
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
        const inviteLink =
            await this.organisationRepository.createOrganisationInviteLink({
                organisationId: organisation.id,
            });
        if (!inviteLink) {
            throw new NotFoundError();
        }
        return {
            ...inviteLink,
            inviteLink: `${Config.httpFrontendUrl}/organisations/join/${inviteLink.token}`,
        };
    }

    public async joinOrganisationWithInviteLink(
        token: string,
        session: SessionInformation
    ) {
        const data =
            await this.organisationRepository.getOrganisationByInviteLink(
                token
            );
        if (!data) {
            throw new NotFoundError();
        }
        if (data.organisation_invite_link.expirationDate < new Date()) {
            throw new ApiError('Dieser Einladungslink ist leider abgelaufen.');
        }
        if (
            await this.organisationRepository.isMemberOfOrganisationById(
                data.organisation.id,
                session.user.id
            )
        ) {
            throw new ApiError(
                'Sie sind bereits Mitglied dieser Organisation.'
            );
        }
        await this.organisationRepository.addMemberToOrganisation(
            data.organisation.id,
            session.user.id
        );
        return data.organisation;
    }

    public async ensureAtLeastOneAdmin(
        id: OrganisationId,
        removedMember: string
    ) {
        const count = await this.organisationRepository.getAdminCountWithout(
            id,
            removedMember
        );
        if (!(count > 0)) {
            throw new ApiError(
                'Die Organisation braucht mindestens einen Administrator.'
            );
        }
    }

    public async updateMembershipRole(
        id: OrganisationMembershipId,
        session: SessionInformation,
        newRole: OrganisationMembershipRole
    ) {
        const membership =
            await this.organisationRepository.getOrganisationMembershipById(id);
        if (!membership) {
            throw new NotFoundError();
        }
        if (
            !(await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                membership.organisation.id,
                session.user.id,
                ['admin']
            ))
        ) {
            throw new PermissionDeniedError();
        }

        if (newRole !== 'admin') {
            await this.ensureAtLeastOneAdmin(
                membership.organisation.id,
                membership.users.id
            );
        }
        await this.organisationRepository.updateMembershipRole(id, newRole);
    }

    public async deleteMembership(
        id: OrganisationMembershipId,
        session: SessionInformation
    ) {
        const membership =
            await this.organisationRepository.getOrganisationMembershipById(id);
        if (!membership) {
            throw new NotFoundError();
        }
        if (
            !(await this.organisationRepository.isMemberWithRoleOfOrganisationById(
                membership.organisation.id,
                session.user.id,
                ['admin']
            ))
        ) {
            throw new PermissionDeniedError();
        }

        if (membership.organisation_membership.role === 'admin') {
            await this.ensureAtLeastOneAdmin(
                membership.organisation.id,
                membership.users.id
            );
        }

        await this.organisationRepository.deleteMembership(id);
    }

    public async leaveOrganisation(
        id: OrganisationId,
        session: SessionInformation
    ) {
        const membership =
            await this.organisationRepository.getOrganisationMembershipByUser(
                id,
                session.user.id
            );
        if (!membership) {
            throw new NotFoundError();
        }

        if (membership.organisation_membership.role === 'admin') {
            await this.ensureAtLeastOneAdmin(
                membership.organisation.id,
                membership.users.id
            );
        }

        await this.organisationRepository.deleteMembership(
            membership.organisation_membership.id
        );
    }
}
