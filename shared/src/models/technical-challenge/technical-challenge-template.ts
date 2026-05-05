import { z } from 'zod';
import { cloneDeep } from 'lodash-es';
import type { WritableDraft } from 'immer';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import { imagePropertiesSchema } from '../utils/image-properties.js';
import { newNoPosition } from '../utils/position/no-position.js';
import { newSize } from '../utils/size.js';
import type {
    TechnicalChallenge,
    TechnicalChallengeId,
} from './technical-challenge.js';
import {
    relevantTaskIdsOf,
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
    template: TechnicalChallengeTemplate,
    creationTime: number
): WritableDraft<TechnicalChallenge> {
    const taskIds = relevantTaskIdsOf(template);
    const { states, transitions, name, image } = cloneDeep(template);

    return {
        id: uuid() as TechnicalChallengeId,
        type: 'technicalChallenge',
        templateId: template.id,
        position: newNoPosition(),
        size: newSize(40, 40),
        taskProgress: Object.fromEntries(taskIds.map((id) => [id, 0])),
        currentStateId: template.initialStateId,
        assignedPersonnel: {},
        states,
        transitions,
        name,
        image,
        simulationStartTime: creationTime,
    };
}
