import { z } from 'zod';
import {
    organisationIdSchema,
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

export const getOrganisationResponseDataSchema = z.strictObject({
    id: organisationIdSchema,
    name: z.string(),
    description: z.string(),
    createdAt: stringToDate,
    userRole: organisationMembershipRoleSchema.optional(),
});

export type GetOrganisationResponseDataSchema = z.infer<
    typeof getOrganisationResponseDataSchema
>;

export const getOrganisationsResponseDataSchema = z.array(
    getOrganisationResponseDataSchema
);
export type GetOrganisationsResponseDataSchema = z.infer<
    typeof getOrganisationsResponseDataSchema
>;

export const postOrganisationRequestDataSchema = z.strictObject({
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
