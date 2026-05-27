import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import { uuidSchema } from '../../utils/uuid.js';
import { imagePropertiesSchema } from '../utils/image-properties.js';
import { positionSchema } from '../utils/position/position.js';
import { sizeSchema } from '../utils/size.js';
import { stateMachineSchema, type StateMachineState } from './state-machine.js';

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
    stateMachines: z.record(stateMachineSchema.shape.id, stateMachineSchema),
});

export type TechnicalChallenge = Immutable<
    z.infer<typeof technicalChallengeSchema>
>;

export namespace TechnicalChallenge {
    export function getStateById(
        technicalChallenge: WritableDraft<TechnicalChallenge>,
        stateId: StateMachineState['id']
    ): WritableDraft<StateMachineState> | undefined;
    export function getStateById(
        technicalChallenge: TechnicalChallenge,
        stateId: StateMachineState['id']
    ): StateMachineState | undefined {
        const result = Object.values(technicalChallenge.stateMachines)
            .flatMap((machine) => Object.entries(machine.states))
            .find(([key, _]) => key === stateId);
        return result?.[1];
    }
}
