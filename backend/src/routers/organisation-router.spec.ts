import type {
    GetOrganisationResponseData,
    OrganisationMembershipRole,
    PatchOrganisationMembershipRequestData,
    PatchOrganisationRequestData,
    PostOrganisationRequestData,
} from 'fuesim-digital-shared';
import {
    getOrganisationDetailsResponseDataSchema,
    getOrganisationResponseDataSchema,
    getOrganisationsResponseDataSchema,
    postOrganisationInviteLinkResponseDataSchema,
    uuid,
} from 'fuesim-digital-shared';
import {
    createTestUserSession,
    createTestEnvironment,
    defaultTestUserSessionData,
    alternativeTestUserSessionData,
} from '../test/utils.js';
import { createOrganisation } from '../test/organisation-utils.js';

describe('organisation router', () => {
    const environment = createTestEnvironment();
    let session: string;
    beforeEach(async () => {
        environment.services.exerciseService.TESTING_getExerciseMap().clear();
        session = await createTestUserSession(environment);
    });

    describe('GET /api/organisations', () => {
        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('get', '/api/organisations')
                .expect(403);
        });

        it('returns an empty list for no organisations', async () => {
            const response = await environment
                .httpRequest('get', '/api/organisations', session)
                .expect(200);

            const parsed = getOrganisationsResponseDataSchema.parse(
                response.body
            );
            expect(parsed).toEqual([]);
        });

        it('returns personal organisation', async () => {
            const organisation =
                await environment.services.organisationService.ensurePersonalOrganisation(
                    defaultTestUserSessionData
                );

            const response = await environment
                .httpRequest('get', '/api/organisations', session)
                .expect(200);

            const parsed = getOrganisationsResponseDataSchema.parse(
                response.body
            );
            expect(parsed).toHaveLength(1);
            expect(parsed[0]!.id).toBe(organisation.id);
            expect(parsed[0]!.userRole).toBe(
                'admin' satisfies OrganisationMembershipRole
            );
            expect(parsed[0]!.personalOrganisationOf).toBe(
                defaultTestUserSessionData.id
            );
        });

        it.each([
            'viewer',
            'editor',
            'admin',
        ] satisfies OrganisationMembershipRole[])(
            'returns only own organisations as %s',
            async (role) => {
                const org1 = await createOrganisation(environment, session);

                const session2 = await createTestUserSession(environment, {
                    user: alternativeTestUserSessionData,
                });
                await createOrganisation(environment, session2);

                const membership =
                    (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                        org1.id,
                        defaultTestUserSessionData.id
                    ))!;
                await environment.repositories.organisationRepository.updateMembershipRole(
                    membership.organisation_membership.id,
                    role
                );
                const response = await environment
                    .httpRequest('get', `/api/organisations/`, session)
                    .expect(200);
                const parsed = getOrganisationsResponseDataSchema.parse(
                    response.body
                );
                expect(parsed).toHaveLength(1);
                const orgData = parsed[0]!;
                expect(orgData.id).toBe(org1.id);
                expect(orgData.name).toBe(org1.name);
                expect(orgData.description).toBe(org1.description);
                expect(orgData.personalOrganisationOf).toBe(null);
                expect(orgData.userRole).toBe(role);
            }
        );
    });

    describe('GET /api/organisations/editor', () => {
        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('get', '/api/organisations/editor')
                .expect(403);
        });

        it('returns an empty list for no organisations', async () => {
            const response = await environment
                .httpRequest('get', '/api/organisations/editor', session)
                .expect(200);

            const parsed = getOrganisationsResponseDataSchema.parse(
                response.body
            );
            expect(parsed).toEqual([]);
        });

        it('returns personal organisation', async () => {
            const organisation =
                await environment.services.organisationService.ensurePersonalOrganisation(
                    defaultTestUserSessionData
                );

            const response = await environment
                .httpRequest('get', '/api/organisations/editor', session)
                .expect(200);
            const parsed = getOrganisationsResponseDataSchema.parse(
                response.body
            );
            expect(parsed).toHaveLength(1);
            expect(parsed[0]!.id).toBe(organisation.id);
        });

        it('returns only organisations as editor/admin', async () => {
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });

            await createOrganisation(environment, session2);

            const adminOrg = await createOrganisation(environment, session2);
            await environment.repositories.organisationRepository.addMemberToOrganisation(
                adminOrg.id,
                defaultTestUserSessionData.id,
                'admin'
            );

            const viewerOrg = await createOrganisation(environment, session2);
            await environment.repositories.organisationRepository.addMemberToOrganisation(
                viewerOrg.id,
                defaultTestUserSessionData.id,
                'viewer'
            );

            const editorOrg = await createOrganisation(environment, session2);
            await environment.repositories.organisationRepository.addMemberToOrganisation(
                editorOrg.id,
                defaultTestUserSessionData.id,
                'editor'
            );

            const response = await environment
                .httpRequest('get', '/api/organisations/editor', session)
                .expect(200);
            const parsed = getOrganisationsResponseDataSchema.parse(
                response.body
            );
            expect(parsed).toHaveLength(2);
            expect(new Set(parsed.map((o) => o.id))).toEqual(
                new Set([editorOrg.id, adminOrg.id])
            );
        });
    });

    describe('POST /api/organisations', () => {
        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('post', '/api/organisations')
                .expect(403);
        });

        it('succeeds creating an organisation', async () => {
            const beforeCreation = new Date();

            const testData = {
                name: 'Test Organisation',
                description: 'Test Description',
            } satisfies PostOrganisationRequestData;
            const response = await environment
                .httpRequest('post', '/api/organisations', session)
                .send(testData)
                .expect(201);

            const parsed = getOrganisationResponseDataSchema.parse(
                response.body
            );
            expect(parsed.name).toEqual(testData.name);
            expect(parsed.createdAt.getTime()).toBeGreaterThan(
                beforeCreation.getTime()
            );
            expect(parsed.createdAt.getTime()).toBeLessThan(Date.now());
            expect(parsed.personalOrganisationOf).toBe(null);

            const memberships =
                await environment.repositories.organisationRepository.getOrganisationMembersById(
                    parsed.id
                );
            expect(memberships).toHaveLength(1);
            const membership = memberships[0]!;
            expect(membership.user.id).toBe(defaultTestUserSessionData.id);
            expect(membership.role).toBe(
                'admin' satisfies OrganisationMembershipRole
            );
        });
        it('fails creating a parallel exercise with invalid data', async () => {
            const testData = {
                name: '',
                description: '',
            };
            await environment
                .httpRequest('post', '/api/organisations', session)
                .send(testData)
                .expect(400);
        });
    });

    describe('GET /api/organisations/:id', () => {
        let organisation: GetOrganisationResponseData;
        let session2: string;
        beforeEach(async () => {
            organisation = await createOrganisation(environment, session);
            session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
        });

        it('fails with 404 if not existing', async () => {
            await environment
                .httpRequest('get', `/api/organisations/${uuid()}`, session)
                .expect(404);
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('get', `/api/organisations/${organisation.id}`)
                .expect(403);
        });

        it('fails with 403 if no member', async () => {
            await environment
                .httpRequest(
                    'get',
                    `/api/organisations/${organisation.id}`,
                    session2
                )
                .expect(403);
        });

        it('succeeds with 200 if personal organisation', async () => {
            organisation =
                await environment.services.organisationService.ensurePersonalOrganisation(
                    defaultTestUserSessionData
                );

            const response = await environment
                .httpRequest(
                    'get',
                    `/api/organisations/${organisation.id}`,
                    session
                )
                .expect(200);
            const parsed = getOrganisationDetailsResponseDataSchema.parse(
                response.body
            );
            expect(parsed.id).toBe(organisation.id);
            expect(parsed.userRole).toBe(
                'admin' satisfies OrganisationMembershipRole
            );
            expect(parsed.personalOrganisationOf).toBe(
                defaultTestUserSessionData.id
            );
        });

        it.each([
            'viewer',
            'editor',
            'admin',
        ] satisfies OrganisationMembershipRole[])(
            'succeeds with 200 if %s',
            async (role) => {
                await environment.repositories.organisationRepository.addMemberToOrganisation(
                    organisation.id,
                    alternativeTestUserSessionData.id,
                    role
                );
                const response = await environment
                    .httpRequest(
                        'get',
                        `/api/organisations/${organisation.id}/`,
                        session2
                    )
                    .expect(200);
                const parsed = getOrganisationDetailsResponseDataSchema.parse(
                    response.body
                );
                expect(parsed.id).toBe(organisation.id);
                expect(parsed.name).toBe(organisation.name);
                expect(parsed.description).toBe(organisation.description);
                expect(parsed.personalOrganisationOf).toBe(null);
                expect(parsed.userRole).toBe(role);

                expect(parsed.members).toHaveLength(2);

                expect(
                    new Set(parsed.members.map((m) => [m.role, m.user.id]))
                ).toEqual(
                    new Set([
                        ['admin', defaultTestUserSessionData.id],
                        [role, alternativeTestUserSessionData.id],
                    ])
                );
            }
        );
    });

    describe('PATCH /api/organisations/:id', () => {
        const testData = {
            name: 'Other Name',
            description: 'Other Description',
        } satisfies PatchOrganisationRequestData;

        let organisation: GetOrganisationResponseData;
        let session2: string;
        beforeEach(async () => {
            organisation = await createOrganisation(environment, session);
            session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
        });

        it('fails with 404 if not existing', async () => {
            await environment
                .httpRequest('patch', `/api/organisations/${uuid()}/`, session)
                .send(testData)
                .expect(404);
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('patch', `/api/organisations/${organisation.id}/`)
                .send(testData)
                .expect(403);
        });

        it('fails with 403 if no member', async () => {
            await environment
                .httpRequest(
                    'patch',
                    `/api/organisations/${organisation.id}/`,
                    session2
                )
                .send(testData)
                .expect(403);
        });

        it('fails with 403 if personal organisation', async () => {
            organisation =
                await environment.services.organisationService.ensurePersonalOrganisation(
                    defaultTestUserSessionData
                );
            await environment
                .httpRequest(
                    'patch',
                    `/api/organisations/${organisation.id}/`,
                    session
                )
                .send(testData)
                .expect(403);
        });

        it.each(['viewer', 'editor'] satisfies OrganisationMembershipRole[])(
            'fails with 403 if %s',
            async (role) => {
                await environment.repositories.organisationRepository.addMemberToOrganisation(
                    organisation.id,
                    alternativeTestUserSessionData.id,
                    role
                );
                await environment
                    .httpRequest(
                        'patch',
                        `/api/organisations/${organisation.id}`,
                        session2
                    )
                    .send(testData)
                    .expect(403);
            }
        );

        it('succeeds with 200 if admin', async () => {
            await environment.repositories.organisationRepository.addMemberToOrganisation(
                organisation.id,
                alternativeTestUserSessionData.id,
                'admin'
            );
            const response = await environment
                .httpRequest(
                    'patch',
                    `/api/organisations/${organisation.id}`,
                    session2
                )
                .send(testData)
                .expect(200);
            const parsed = getOrganisationResponseDataSchema.parse(
                response.body
            );
            expect(parsed.name).toBe(testData.name);
            expect(parsed.description).toBe(testData.description);

            const changedOrg =
                (await environment.repositories.organisationRepository.getOrganisationById(
                    organisation.id
                ))!;
            expect(changedOrg.name).toBe(testData.name);
            expect(changedOrg.description).toBe(testData.description);
        });

        it('succeeds with 200 if partial data', async () => {
            await environment.repositories.organisationRepository.addMemberToOrganisation(
                organisation.id,
                alternativeTestUserSessionData.id,
                'admin'
            );
            const response = await environment
                .httpRequest(
                    'patch',
                    `/api/organisations/${organisation.id}`,
                    session2
                )
                .send({ name: testData.name })
                .expect(200);
            const parsed = getOrganisationResponseDataSchema.parse(
                response.body
            );
            expect(parsed.name).toBe(testData.name);
            expect(parsed.description).not.toBe(testData.description);

            const changedOrg =
                (await environment.repositories.organisationRepository.getOrganisationById(
                    organisation.id
                ))!;
            expect(changedOrg.name).toBe(testData.name);
            expect(changedOrg.description).not.toBe(testData.description);
        });

        it('fails with wrong data', async () => {
            await environment.repositories.organisationRepository.addMemberToOrganisation(
                organisation.id,
                alternativeTestUserSessionData.id,
                'admin'
            );
            await environment
                .httpRequest(
                    'patch',
                    `/api/organisations/${organisation.id}`,
                    session2
                )
                .send({ name: '' })
                .expect(400);
        });
    });

    describe('DELETE /api/organisations/:id', () => {
        let organisation: GetOrganisationResponseData;
        let session2: string;
        beforeEach(async () => {
            organisation = await createOrganisation(environment, session);
            session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
        });

        it('fails with 404 if not existing', async () => {
            await environment
                .httpRequest('delete', `/api/organisations/${uuid()}/`, session)
                .expect(404);
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('delete', `/api/organisations/${organisation.id}/`)
                .expect(403);
        });

        it('fails with 403 if no member', async () => {
            await environment
                .httpRequest(
                    'delete',
                    `/api/organisations/${organisation.id}/`,
                    session2
                )
                .expect(403);
        });

        it('Fails with 403 if personal organisation', async () => {
            organisation =
                await environment.services.organisationService.ensurePersonalOrganisation(
                    defaultTestUserSessionData
                );
            await environment
                .httpRequest(
                    'delete',
                    `/api/organisations/${organisation.id}/`,
                    session
                )
                .expect(403);
        });

        it.each(['viewer', 'editor'] satisfies OrganisationMembershipRole[])(
            'fails with 403 if %s',
            async (role) => {
                await environment.repositories.organisationRepository.addMemberToOrganisation(
                    organisation.id,
                    alternativeTestUserSessionData.id,
                    role
                );
                await environment
                    .httpRequest(
                        'delete',
                        `/api/organisations/${organisation.id}`,
                        session2
                    )
                    .expect(403);
            }
        );

        it('succeeds with 204 if admin', async () => {
            await environment.repositories.organisationRepository.addMemberToOrganisation(
                organisation.id,
                alternativeTestUserSessionData.id,
                'admin'
            );
            await environment
                .httpRequest(
                    'delete',
                    `/api/organisations/${organisation.id}`,
                    session2
                )
                .expect(204);

            const deletedOrg =
                await environment.repositories.organisationRepository.getOrganisationById(
                    organisation.id
                );
            expect(deletedOrg).toBe(null);
            // TODO Ensure deletion of exercise templates and memberships
        });
    });

    describe('POST /api/organisations/:id/invite_links', () => {
        let organisation: GetOrganisationResponseData;
        beforeEach(async () => {
            organisation = await createOrganisation(environment, session);
        });

        it('fails with 404 if not existing', async () => {
            await environment
                .httpRequest(
                    'post',
                    `/api/organisations/${uuid()}/invite_links`,
                    session
                )
                .expect(404);
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest(
                    'post',
                    `/api/organisations/${organisation.id}/invite_links`
                )
                .expect(403);
        });

        it('fails with 403 if no member', async () => {
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await environment
                .httpRequest(
                    'post',
                    `/api/organisations/${organisation.id}/invite_links`,
                    session2
                )
                .expect(403);
        });

        it('fails with 403 if personal organisation', async () => {
            organisation =
                await environment.services.organisationService.ensurePersonalOrganisation(
                    defaultTestUserSessionData
                );
            await environment
                .httpRequest(
                    'post',
                    `/api/organisations/${organisation.id}/invite_links`,
                    session
                )
                .expect(403);
        });

        it.each(['viewer', 'editor'] satisfies OrganisationMembershipRole[])(
            "fails with 403 if %s'",
            async (role) => {
                const membership =
                    (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                        organisation.id,
                        defaultTestUserSessionData.id
                    ))!;
                await environment.repositories.organisationRepository.updateMembershipRole(
                    membership.organisation_membership.id,
                    role
                );
                await environment
                    .httpRequest(
                        'post',
                        `/api/organisations/${organisation.id}/invite_links`,
                        session
                    )
                    .expect(403);
            }
        );
        it('succeeds with 201 if admin', async () => {
            const membership =
                (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                    organisation.id,
                    defaultTestUserSessionData.id
                ))!;
            await environment.repositories.organisationRepository.updateMembershipRole(
                membership.organisation_membership.id,
                'admin'
            );
            const response = await environment
                .httpRequest(
                    'post',
                    `/api/organisations/${organisation.id}/invite_links`,
                    session
                )
                .expect(201);
            const parsed = postOrganisationInviteLinkResponseDataSchema.parse(
                response.body
            );
            expect(parsed.expirationDate.getTime()).toBeGreaterThan(
                new Date().getTime()
            );
        });
    });

    describe('POST /api/organisations/join/:token', () => {
        let organisation: GetOrganisationResponseData;
        let inviteToken: string;
        beforeEach(async () => {
            organisation = await createOrganisation(environment, session);
            inviteToken =
                (await environment.repositories.organisationRepository.createOrganisationInviteLink(
                    {
                        organisationId: organisation.id,
                    }
                ))!.token;
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest('post', `/api/organisations/join/${inviteToken}`)
                .expect(403);
        });

        it('fails with 403 if invalid token', async () => {
            await environment
                .httpRequest('post', `/api/organisations/join/invalid_token`)
                .expect(403);
        });

        it('fails with 400 if already member', async () => {
            const response = await environment
                .httpRequest(
                    'post',
                    `/api/organisations/join/${inviteToken}`,
                    session
                )
                .expect(400);
            expect(response.body.message).toBe(
                'Sie sind bereits Mitglied dieser Organisation.'
            );
        });

        it('succeeds with 200', async () => {
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            await environment
                .httpRequest(
                    'post',
                    `/api/organisations/join/${inviteToken}`,
                    session2
                )
                .expect(200);
            const membership =
                (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                    organisation.id,
                    alternativeTestUserSessionData.id
                ))!;
            expect(membership.organisation_membership.role).toBe(
                'viewer' satisfies OrganisationMembershipRole
            );
        });

        it('fails with 400 if link expired', async () => {
            const session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
            inviteToken =
                (await environment.repositories.organisationRepository.createOrganisationInviteLink(
                    {
                        organisationId: organisation.id,
                        expirationDate: new Date(),
                    }
                ))!.token;
            const response = await environment
                .httpRequest(
                    'post',
                    `/api/organisations/join/${inviteToken}`,
                    session2
                )
                .expect(400);
            expect(response.body.message).toBe(
                'Dieser Einladungslink ist leider abgelaufen.'
            );
        });
    });

    describe('POST /api/organisations/:id/leave', () => {
        let organisation: GetOrganisationResponseData;
        let session2: string;
        beforeEach(async () => {
            organisation = await createOrganisation(environment, session);
            session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
        });

        it('fails with 404 if not existing', async () => {
            await environment
                .httpRequest(
                    'post',
                    `/api/organisations/${uuid()}/leave`,
                    session
                )
                .expect(404);
        });

        it('fails with 403 if not authenticated', async () => {
            await environment
                .httpRequest(
                    'post',
                    `/api/organisations/${organisation.id}/leave`
                )
                .expect(403);
        });

        it('fails with 404 if no member', async () => {
            await environment
                .httpRequest(
                    'post',
                    `/api/organisations/${organisation.id}/leave`,
                    session2
                )
                .expect(404);
        });

        it('fails with 403 if personal organisation', async () => {
            organisation =
                await environment.services.organisationService.ensurePersonalOrganisation(
                    defaultTestUserSessionData
                );
            await environment
                .httpRequest(
                    'post',
                    `/api/organisations/${organisation.id}/leave`,
                    session
                )
                .expect(403);
        });

        it.each([
            'viewer',
            'editor',
            'admin',
        ] satisfies OrganisationMembershipRole[])(
            'succeeds with 200 if %s',
            async (role) => {
                await environment.repositories.organisationRepository.addMemberToOrganisation(
                    organisation.id,
                    alternativeTestUserSessionData.id,
                    role
                );
                await environment
                    .httpRequest(
                        'post',
                        `/api/organisations/${organisation.id}/leave`,
                        session2
                    )
                    .expect(200);
                const membership =
                    await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                        organisation.id,
                        alternativeTestUserSessionData.id
                    );
                expect(membership).toBe(null);
            }
        );

        it('fails with 400 if last admin', async () => {
            const response = await environment
                .httpRequest(
                    'post',
                    `/api/organisations/${organisation.id}/leave`,
                    session
                )
                .expect(400);
            expect(response.body.message).toBe(
                'Die Organisation braucht mindestens einen Administrator.'
            );
        });
    });

    describe('PATCH /api/organisations/:id/memberships/:id', () => {
        let organisation: GetOrganisationResponseData;
        let session2: string;
        beforeEach(async () => {
            organisation = await createOrganisation(environment, session);
            session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
        });

        it('fails with 404 if not existing', async () => {
            await environment
                .httpRequest(
                    'patch',
                    `/api/organisations/memberships/${uuid()}`,
                    session
                )
                .send({
                    role: 'viewer',
                } satisfies PatchOrganisationMembershipRequestData)
                .expect(404);
        });

        it('fails with 403 if not authenticated', async () => {
            const membership =
                (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                    organisation.id,
                    defaultTestUserSessionData.id
                ))!;
            await environment
                .httpRequest(
                    'patch',
                    `/api/organisations/memberships/${membership.organisation_membership.id}`
                )
                .send({
                    role: 'viewer',
                } satisfies PatchOrganisationMembershipRequestData)
                .expect(403);
        });

        it('fails with 403 if no member', async () => {
            const membership =
                (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                    organisation.id,
                    defaultTestUserSessionData.id
                ))!;
            await environment
                .httpRequest(
                    'patch',
                    `/api/organisations/memberships/${membership.organisation_membership.id}`,
                    session2
                )
                .send({
                    role: 'viewer',
                } satisfies PatchOrganisationMembershipRequestData)
                .expect(403);
        });

        it('fails with 403 if personal organisation', async () => {
            organisation =
                await environment.services.organisationService.ensurePersonalOrganisation(
                    defaultTestUserSessionData
                );
            const membership =
                (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                    organisation.id,
                    defaultTestUserSessionData.id
                ))!;
            await environment
                .httpRequest(
                    'patch',
                    `/api/organisations/memberships/${membership.organisation_membership.id}`,
                    session
                )
                .send({
                    role: 'viewer',
                } satisfies PatchOrganisationMembershipRequestData)
                .expect(403);
        });

        it.each(['viewer', 'editor'] satisfies OrganisationMembershipRole[])(
            'fails with 403 if %s',
            async (role) => {
                const newRole = role === 'viewer' ? 'editor' : 'viewer';
                const membership =
                    (await environment.repositories.organisationRepository.addMemberToOrganisation(
                        organisation.id,
                        alternativeTestUserSessionData.id,
                        role
                    ))!;
                await environment
                    .httpRequest(
                        'patch',
                        `/api/organisations/memberships/${membership.id}`,
                        session2
                    )
                    .send({
                        role: newRole,
                    } satisfies PatchOrganisationMembershipRequestData)
                    .expect(403);
            }
        );

        it('succeeds with 200 if admin', async () => {
            const membership =
                (await environment.repositories.organisationRepository.addMemberToOrganisation(
                    organisation.id,
                    alternativeTestUserSessionData.id,
                    'editor'
                ))!;
            await environment
                .httpRequest(
                    'patch',
                    `/api/organisations/memberships/${membership.id}`,
                    session
                )
                .send({
                    role: 'viewer',
                } satisfies PatchOrganisationMembershipRequestData)
                .expect(200);

            const updatedMembership =
                (await environment.repositories.organisationRepository.getOrganisationMembershipById(
                    membership.id
                ))!;
            expect(updatedMembership.organisation_membership.role).toBe(
                'viewer'
            );
        });

        it('fails with 400 if last admin', async () => {
            const membership =
                (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                    organisation.id,
                    defaultTestUserSessionData.id
                ))!;
            const response = await environment
                .httpRequest(
                    'patch',
                    `/api/organisations/memberships/${membership.organisation_membership.id}`,
                    session
                )
                .send({
                    role: 'viewer',
                } satisfies PatchOrganisationMembershipRequestData)
                .expect(400);
            expect(response.body.message).toBe(
                'Die Organisation braucht mindestens einen Administrator.'
            );
        });
    });

    describe('DELETE /api/organisations/:id/memberships/:id', () => {
        let organisation: GetOrganisationResponseData;
        let session2: string;
        beforeEach(async () => {
            organisation = await createOrganisation(environment, session);
            session2 = await createTestUserSession(environment, {
                user: alternativeTestUserSessionData,
            });
        });

        it('fails with 404 if not existing', async () => {
            await environment
                .httpRequest(
                    'delete',
                    `/api/organisations/memberships/${uuid()}`,
                    session
                )
                .expect(404);
        });

        it('fails with 403 if not authenticated', async () => {
            const membership =
                (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                    organisation.id,
                    defaultTestUserSessionData.id
                ))!;
            await environment
                .httpRequest(
                    'delete',
                    `/api/organisations/memberships/${membership.organisation_membership.id}`
                )
                .expect(403);
        });

        it('fails with 403 if no member', async () => {
            const membership =
                (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                    organisation.id,
                    defaultTestUserSessionData.id
                ))!;
            await environment
                .httpRequest(
                    'delete',
                    `/api/organisations/memberships/${membership.organisation_membership.id}`,
                    session2
                )
                .expect(403);
        });

        it('fails with 403 if personal organisation', async () => {
            organisation =
                await environment.services.organisationService.ensurePersonalOrganisation(
                    defaultTestUserSessionData
                );
            const membership =
                (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                    organisation.id,
                    defaultTestUserSessionData.id
                ))!;
            await environment
                .httpRequest(
                    'delete',
                    `/api/organisations/memberships/${membership.organisation_membership.id}`,
                    session
                )
                .expect(403);
        });

        it.each(['viewer', 'editor'] satisfies OrganisationMembershipRole[])(
            'fails with 403 if %s',
            async (role) => {
                const membership =
                    (await environment.repositories.organisationRepository.addMemberToOrganisation(
                        organisation.id,
                        alternativeTestUserSessionData.id,
                        role
                    ))!;
                await environment
                    .httpRequest(
                        'delete',
                        `/api/organisations/memberships/${membership.id}`,
                        session2
                    )
                    .expect(403);
            }
        );

        it('succeeds with 200 if admin', async () => {
            const membership =
                (await environment.repositories.organisationRepository.addMemberToOrganisation(
                    organisation.id,
                    alternativeTestUserSessionData.id,
                    'editor'
                ))!;
            await environment
                .httpRequest(
                    'delete',
                    `/api/organisations/memberships/${membership.id}`,
                    session
                )
                .expect(204);

            const updatedMembership =
                await environment.repositories.organisationRepository.getOrganisationMembershipById(
                    membership.id
                );
            expect(updatedMembership).toBe(null);
        });

        it('fails with 400 if last admin', async () => {
            const membership =
                (await environment.repositories.organisationRepository.getOrganisationMembershipByUser(
                    organisation.id,
                    defaultTestUserSessionData.id
                ))!;
            const response = await environment
                .httpRequest(
                    'delete',
                    `/api/organisations/memberships/${membership.organisation_membership.id}`,
                    session
                )
                .expect(400);
            expect(response.body.message).toBe(
                'Die Organisation braucht mindestens einen Administrator.'
            );
        });
    });
});
