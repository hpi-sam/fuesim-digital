import { z } from 'zod';
import { uuidSchema } from '../../utils/index.js';
import {
    positionSchema,
    imagePropertiesSchema,
    sizeSchema,
} from '../utils/index.js';
import { personnelSchema } from '../personnel.js';
import { taskSchema } from '../task.js';
import {
    stateMachineSchema,
    technicalChallengeStateIdSchema,
} from './state-machine.js';
import { userGeneratedContentSchema } from '../user-generated-content.js';

export const technicalChallengeIdSchema = uuidSchema.brand(
    'TechnicalChallengeId'
);
export type TechnicalChallengeId = z.infer<typeof technicalChallengeIdSchema>;

export const technicalChallengeSchema = z.strictObject({
    id: technicalChallengeIdSchema,
    type: z.literal('technicalChallenge'),
    name: z.string(),
    templateId: uuidSchema,
    image: imagePropertiesSchema,
    userGeneratedContent: userGeneratedContentSchema,
    position: positionSchema,
    size: sizeSchema,
    taskProgress: z.record(taskSchema.shape.id, z.number()),
    currentStateId: technicalChallengeStateIdSchema,
    assignedPersonnel: z.record(personnelSchema.shape.id, taskSchema.shape.id),
    ...stateMachineSchema.shape,
});

export type TechnicalChallenge = z.infer<typeof technicalChallengeSchema>;

export function isTechnicalChallenge(
    element: object
): element is TechnicalChallenge {
    return 'type' in element && element.type === 'technicalChallenge';
}
