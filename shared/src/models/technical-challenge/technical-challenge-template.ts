import { z } from 'zod';
import { cloneDeep } from 'lodash-es';
import { castDraft, type Immutable, type WritableDraft } from 'immer';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import { imagePropertiesSchema } from '../utils/image-properties.js';
import { newNoPosition } from '../utils/position/no-position.js';
import { newSize } from '../utils/size.js';
import type {
    TechnicalChallenge,
    TechnicalChallengeId,
} from './technical-challenge.js';
import { type StateMachine, stateMachineSchema } from './state-machine.js';

export const technicalChallengeTemplateSchema = z.strictObject({
    stateMachines: z.record(stateMachineSchema.shape.id, stateMachineSchema),
    id: uuidSchema,
    image: imagePropertiesSchema,
    name: z.string(),
});

export type TechnicalChallengeTemplate = Immutable<
    z.infer<typeof technicalChallengeTemplateSchema>
>;

export function newTechnicalChallengeFromTemplate(
    template: TechnicalChallengeTemplate,
    creationTime: number
): WritableDraft<TechnicalChallenge> {
    const { stateMachines, name, image } = castDraft(cloneDeep(template));

    for (const stateMachine of Object.values(stateMachines)) {
        stateMachine.simulationStartTime = creationTime;
        stateMachine.id = uuid() as StateMachine['id'];
    }

    return {
        id: uuid() as TechnicalChallengeId,
        type: 'technicalChallenge',
        templateId: template.id,
        position: newNoPosition(),
        size: newSize(40, 40),
        name,
        image,
        stateMachines: Object.fromEntries(
            Object.values(stateMachines).map((s) => [s.id, s])
        ),
    };
}
