import {
    getOrganisationDetailsResponseDataSchema,
    getOrganisationResponseDataSchema,
    getOrganisationsResponseDataSchema,
    organisationIdSchema,
    patchOrganisationRequestDataSchema,
    postOrganisationRequestDataSchema,
    postOrganisationInviteLinkResponseDataSchema,
    organisationMembershipIdSchema,
    patchOrganisationMembershipRequestDataSchema,
} from 'fuesim-digital-shared';
import { Router } from 'express';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';
import type { OrganisationService } from '../database/services/organisation-service.js';

export function createOrganisationRouter(
    organisationService: OrganisationService
): Router {
    const router = Router();

    router
        .route('/')
        .all(isAuthenticatedMiddleware)
        .get(async (req, res) => {
            const organisations =
                await organisationService.getOrganisationsForUser(req.session!);
            res.send(getOrganisationsResponseDataSchema.encode(organisations));
        })
        .post(async (req, res) => {
            const parsedData = postOrganisationRequestDataSchema.parse(
                req.body
            );
            const organisation = await organisationService.createOrganisation(
                parsedData,
                req.session!
            );

            res.status(201).send(
                getOrganisationResponseDataSchema.encode(organisation)
            );
        });

    router
        .route('/:id')
        .all(isAuthenticatedMiddleware)
        .get(async (req, res) => {
            const id = organisationIdSchema.parse(req.params.id);

            const organisation =
                await organisationService.getOrganisationDetailsById(
                    id,
                    req.session!
                );
            res.send(
                getOrganisationDetailsResponseDataSchema.encode(organisation)
            );
        })
        .patch(async (req, res) => {
            const id = organisationIdSchema.parse(req.params.id);

            const parsedData = patchOrganisationRequestDataSchema.parse(
                req.body
            );

            const organisation = await organisationService.updateOrganisation(
                id,
                req.session!,
                parsedData
            );
            res.send(getOrganisationResponseDataSchema.encode(organisation));
        });

    router
        .route('/:id/invite_links')
        .all(isAuthenticatedMiddleware)
        .post(async (req, res) => {
            const id = organisationIdSchema.parse(req.params.id);

            const inviteLink =
                await organisationService.createOrganisationInviteLink(
                    id,
                    req.session!
                );

            res.status(201).send(
                postOrganisationInviteLinkResponseDataSchema.encode(inviteLink)
            );
        });

    router
        .route('/memberships/:id')
        .all(isAuthenticatedMiddleware)
        .patch(async (req, res) => {
            const id = organisationMembershipIdSchema.parse(req.params.id);
            const { role } = patchOrganisationMembershipRequestDataSchema.parse(
                req.body
            );

            await organisationService.updateOrganisationMembershipRole(
                id,
                req.session!,
                role
            );

            res.send();
        });

    router
        .route('/join/:token')
        .all(isAuthenticatedMiddleware)
        .post(async (req, res) => {
            const organisation =
                await organisationService.joinOrganisationWithInviteLink(
                    req.params.token,
                    req.session!
                );

            res.status(200).send(
                getOrganisationResponseDataSchema.encode(organisation)
            );
        });

    return router;
}
