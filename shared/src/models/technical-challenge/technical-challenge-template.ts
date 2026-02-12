import { z } from 'zod';
import { cloneDeep } from 'lodash-es';
import { imagePropertiesSchema, newNoPosition } from '../utils/index.js';
import { uuid } from '../../utils/uuid.js';
import type {
    TechnicalChallenge,
    TechnicalChallengeId,
} from './technical-challenge.js';
import {
    stateMachineSchema,
    technicalChallengeStateIdSchema,
} from './state-machine.js';

export const technicalChallengeTemplateSchema = z.strictObject({
    id: z.uuidv4(),
    image: imagePropertiesSchema,
    name: z.string(),
    initialStateId: technicalChallengeStateIdSchema,
    ...stateMachineSchema.shape,
});

export type TechnicalChallengeTemplate = z.infer<
    typeof technicalChallengeTemplateSchema
>;

export function createTechnicalChallengeFromTemplate(
    template: TechnicalChallengeTemplate
): TechnicalChallenge {
    const { states, relevantTasks, transitions, name, image } =
        cloneDeep(template);

    return {
        id: uuid() as TechnicalChallengeId,
        type: 'technicalChallenge',
        templateId: template.id,
        position: newNoPosition(),
        taskProgress: Object.fromEntries(
            relevantTasks.map((task) => [task.id, 0])
        ),
        currentStateId: template.initialStateId,
        assignedPersonnel: {},
        states,
        relevantTasks,
        transitions,
        name,
        image,
    };
}
