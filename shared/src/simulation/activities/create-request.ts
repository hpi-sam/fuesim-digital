import { z } from 'zod';
import type { RequestTarget } from '../../models/utils/request-target/request-target.js';
import type { ExerciseRequestTargetConfiguration } from '../../models/utils/request-target/exercise-request-target.js';
import {
    exerciseRequestTargetConfigurationSchema,
    requestTargetDictionary,
} from '../../models/utils/request-target/exercise-request-target.js';
import type { VehicleResource } from '../../models/utils/rescue-resource.js';
import { vehicleResourceSchema } from '../../models/utils/rescue-resource.js';
import type { UUID } from '../../utils/uuid.js';
import type { SimulationActivity } from './simulation-activity.js';
import { simulationActivityStateSchema } from './simulation-activity.js';

export const createRequestActivityStateSchema =
    simulationActivityStateSchema.extend({
        type: z.literal('createRequestActivity'),
        targetConfiguration: exerciseRequestTargetConfigurationSchema,
        requestedResource: vehicleResourceSchema,
        key: z.string(),
    });
export type CreateRequestActivityState = z.infer<
    typeof createRequestActivityStateSchema
>;

export function newCreateRequestActivityState(
    id: UUID,
    targetConfiguration: ExerciseRequestTargetConfiguration,
    requestedResource: VehicleResource,
    key: string
): CreateRequestActivityState {
    return {
        id,
        type: 'createRequestActivity',
        targetConfiguration,
        requestedResource,
        key,
    };
}

export const createRequestActivity: SimulationActivity<CreateRequestActivityState> =
    {
        activityStateSchema: createRequestActivityStateSchema,
        tick: (
            draftState,
            simulatedRegion,
            activityState,
            _tickInterval,
            terminate
        ) => {
            const requestTarget = requestTargetDictionary[
                activityState.targetConfiguration.type
            ] as RequestTarget<ExerciseRequestTargetConfiguration>;
            requestTarget.createRequest(
                draftState,
                simulatedRegion.id,
                activityState.targetConfiguration,
                activityState.requestedResource,
                activityState.key
            );
            terminate();
        },
    };
