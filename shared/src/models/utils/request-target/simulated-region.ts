import { z } from 'zod';
import type { UUID } from '../../../utils/uuid.js';
import { uuidSchema } from '../../../utils/uuid.js';
import { getElement } from '../../../store/action-reducers/utils/get-element.js';
import { sendSimulationEvent } from '../../../simulation/events/utils.js';
import { newResourceRequiredEvent } from '../../../simulation/events/resources-required.js';
import type { RequestTarget } from './request-target.js';
import { requestTargetConfigurationSchema } from './request-target.js';

export const simulatedRegionRequestTargetConfigurationSchema =
    requestTargetConfigurationSchema.extend({
        type: z.literal('simulatedRegionRequestTarget'),
        targetSimulatedRegionId: uuidSchema,
    });
export type SimulatedRegionRequestTargetConfiguration = z.infer<
    typeof simulatedRegionRequestTargetConfigurationSchema
>;

export function newSimulatedRegionRequestTargetConfiguration(
    targetSimulatedRegionId: UUID
): SimulatedRegionRequestTargetConfiguration {
    return {
        type: 'simulatedRegionRequestTarget',
        targetSimulatedRegionId,
    };
}
export const simulatedRegionRequestTarget: RequestTarget<SimulatedRegionRequestTargetConfiguration> =
    {
        configurationSchema: simulatedRegionRequestTargetConfigurationSchema,
        type: 'simulatedRegionRequestTarget',
        createRequest: (
            draftState,
            requestingSimulatedRegionId,
            configuration,
            requestedResource,
            key
        ) => {
            sendSimulationEvent(
                getElement(
                    draftState,
                    'simulatedRegion',
                    configuration.targetSimulatedRegionId
                ),
                newResourceRequiredEvent(
                    requestingSimulatedRegionId,
                    requestedResource,
                    key
                )
            );
        },
    };
