import { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';
import { imagePropertiesSchema } from '../utils/image-properties.js';
import { positionSchema } from '../utils/position/position.js';
import { taskSchema } from '../task.js';
import { personnelSchema } from '../personnel.js';
import { sizeSchema } from '../utils/size.js';
import {
    stateMachineSchema,
    technicalChallengeStateIdSchema,
} from './state-machine.js';

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
    position: positionSchema,
    size: sizeSchema,
    taskProgress: z.record(taskSchema.shape.id, z.number()),
    currentStateId: technicalChallengeStateIdSchema,
    assignedPersonnel: z.record(personnelSchema.shape.id, taskSchema.shape.id),
    ...stateMachineSchema.shape,
});

export type TechnicalChallenge = z.infer<typeof technicalChallengeSchema>;
