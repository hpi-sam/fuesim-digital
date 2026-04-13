import { z } from 'zod';
import {
    organisationIdSchema,
    organisationInviteLinkIdSchema,
    organisationMembershipIdSchema,
} from '../ids.js';
import { validationMessages } from '../validation-messages.js';
import { stringToDate } from './utils.js';

export const organisationMembershipRoleAllowedValues = [
    'viewer',
    'editor',
    'admin',
] as const;
export const organisationMembershipRoleSchema = z.literal(
    organisationMembershipRoleAllowedValues
);
export type OrganisationMembershipRole = z.infer<
    typeof organisationMembershipRoleSchema
>;

export const organisationMembershipRoleToGermanNameDictionary: {
    [Key in OrganisationMembershipRole]: string;
} = {
    viewer: 'Betrachter',
    editor: 'Bearbeiter',
    admin: 'Administrator',
} as const;

export const getOrganisationResponseDataSchema = z.object({
    id: organisationIdSchema,
    name: z.string(),
    description: z.string(),
    createdAt: stringToDate,
});

export type GetOrganisationResponseDataSchema = z.infer<
    typeof getOrganisationResponseDataSchema
>;

export const getOrganisationDetailsResponseDataSchema = z.object({
    ...getOrganisationResponseDataSchema.shape,
    userRole: organisationMembershipRoleSchema.nullable(),
    members: z.array(
        z.object({
            id: organisationMembershipIdSchema,
            user: z.object({
                id: z.string(),
                displayName: z.string(),
            }),
            role: organisationMembershipRoleSchema,
        })
    ),
});

export type GetOrganisationDetailsResponseDataSchema = z.infer<
    typeof getOrganisationDetailsResponseDataSchema
>;

export const getOrganisationsResponseDataSchema = z.array(
    z.object({
        ...getOrganisationResponseDataSchema.shape,
        userRole: organisationMembershipRoleSchema.nullable(),
    })
);
export type GetOrganisationsResponseDataSchema = z.infer<
    typeof getOrganisationsResponseDataSchema
>;

export const postOrganisationRequestDataSchema = z.object({
    name: z
        .string()
        .nonempty(validationMessages.required)
        .max(255, validationMessages.tooLong)
        .trim(),
    description: z.string().trim(),
});
export type PostOrganisationRequestDataSchema = z.infer<
    typeof postOrganisationRequestDataSchema
>;

export const patchOrganisationRequestDataSchema =
    postOrganisationRequestDataSchema.partial();
export type PatchOrganisationRequestData = z.infer<
    typeof patchOrganisationRequestDataSchema
>;

export const postOrganisationInviteLinkResponseDataSchema = z.object({
    id: organisationInviteLinkIdSchema,
    inviteLink: z.url(),
    expirationDate: stringToDate,
});
export type PostOrganisationInviteLinkResponseData = z.infer<
    typeof postOrganisationInviteLinkResponseDataSchema
>;

export const patchOrganisationMembershipRequestDataSchema = z.object({
    role: organisationMembershipRoleSchema,
});
export type PatchOrganisationMembershipRequestData = z.infer<
    typeof patchOrganisationMembershipRequestDataSchema
>;
