import * as z from 'zod';

export const operationalSectionSchema = z.object({
    type: z.literal('operationalSection'),
    id: z.uuidv4(),
    title: z.string().optional(),
});

export type OperationalSection = z.infer<typeof operationalSectionSchema>;

export const localOperationsCommandAssignmentSchema = z.object({
    type: z.literal('localOperationsCommand'),
});

export const operationalSectionAssignmentSchema = z.object({
    type: z.literal('operationalSection'),
    role: z.union([
        z.literal('operationalSectionLeader'),
        z.literal('operationalSectionMember'),
    ]),
    sectionId: z.uuidv4(),
});

export type OperationalSectionAssignment = z.infer<
    typeof operationalSectionAssignmentSchema
>;

export const operationalAssignmentSchema = z.union([
    localOperationsCommandAssignmentSchema,
    operationalSectionAssignmentSchema,
]);

export type OperationalAssignment = z.infer<typeof operationalAssignmentSchema>;
