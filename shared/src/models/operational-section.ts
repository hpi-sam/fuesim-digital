import * as z from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../utils/uuid.js';

export const operationalSectionSchema = z.object({
    type: z.literal('operationalSection'),
    id: uuidSchema,
    title: z.string().optional(),
});

export type OperationalSection = Immutable<
    z.infer<typeof operationalSectionSchema>
>;

export const localOperationsCommandAssignmentSchema = z.strictObject({
    type: z.literal('localOperationsCommand'),
});

export const operationalSectionBaseAssignmentSchema = z.strictObject({
    type: z.literal('operationalSection'),
    sectionId: uuidSchema,
});

export const operationalSectionLeaderAssignmentSchema = z.strictObject({
    ...operationalSectionBaseAssignmentSchema.shape,
    role: z.literal('operationalSectionLeader'),
});

export const operationalSectionMemberAssignmentSchema = z.strictObject({
    ...operationalSectionBaseAssignmentSchema.shape,
    role: z.literal('operationalSectionMember'),
    position: z.number(),
});

export const operationalSectionAssignmentSchema = z.union([
    operationalSectionLeaderAssignmentSchema,
    operationalSectionMemberAssignmentSchema,
]);

export type OperationalSectionAssignment = Immutable<
    z.infer<typeof operationalSectionAssignmentSchema>
>;

export const operationalAssignmentSchema = z.union([
    localOperationsCommandAssignmentSchema,
    operationalSectionAssignmentSchema,
]);

export type OperationalAssignment = Immutable<
    z.infer<typeof operationalAssignmentSchema>
>;
