import type { OrganisationMembershipRole } from 'fuesim-digital-shared';
import {
    createTestEnvironment,
    createTestUserSession,
    defaultTestUserSessionData,
} from '../../test/utils.js';

describe('Organisation Service', () => {
    const environment = createTestEnvironment();

    it('ensures personal organisation', async () => {
        await createTestUserSession(environment);
        const organisation =
            await environment.services.organisationService.ensurePersonalOrganisation(
                defaultTestUserSessionData
            );
        expect(organisation.name).toEqual('Private Inhalte');
        expect(organisation.personalOrganisationOf).toBe(
            defaultTestUserSessionData.id
        );

        const memberships =
            await environment.repositories.organisationRepository.getOrganisationMembersById(
                organisation.id
            );
        expect(memberships).toHaveLength(1);
        const membership = memberships[0]!;
        expect(membership.user.id).toBe(defaultTestUserSessionData.id);
        expect(membership.role).toBe(
            'admin' satisfies OrganisationMembershipRole
        );
    });
});
