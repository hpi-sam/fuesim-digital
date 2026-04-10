import {
    getOrganisationDetailsResponseDataSchema,
    getOrganisationResponseDataSchema,
    getOrganisationsResponseDataSchema,
    organisationIdSchema,
    patchOrganisationRequestDataSchema,
    postOrganisationRequestDataSchema,
    postOrganisationInviteLinkResponseDataSchema,
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

            console.log(inviteLink);

            res.status(201).send(
                postOrganisationInviteLinkResponseDataSchema.encode(inviteLink)
            );
        });

    return router;
}
