import { z } from 'zod';
import { cloneDeep } from 'lodash-es';
import {
    imagePropertiesSchema,
    newNoPosition,
    newSize,
} from '../utils/index.js';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import type {
    TechnicalChallenge,
    TechnicalChallengeId,
} from './technical-challenge.js';
import {
    stateMachineSchema,
    technicalChallengeStateIdSchema,
} from './state-machine.js';

export const technicalChallengeTemplateSchema = z.strictObject({
    ...stateMachineSchema.shape,
    id: uuidSchema,
    image: imagePropertiesSchema,
    name: z.string(),
    initialStateId: technicalChallengeStateIdSchema,
});

export type TechnicalChallengeTemplate = z.infer<
    typeof technicalChallengeTemplateSchema
>;

export function newTechnicalChallengeFromTemplate(
    template: TechnicalChallengeTemplate
): TechnicalChallenge {
    const { states, relevantTasks, transitions, name, image } =
        cloneDeep(template);

    return {
        id: uuid() as TechnicalChallengeId,
        type: 'technicalChallenge',
        templateId: template.id,
        position: newNoPosition(),
        size: newSize(40, 40),
        taskProgress: Object.fromEntries(
            Object.values(relevantTasks).map((task) => [task.id, 0])
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
