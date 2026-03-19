import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuid, uuidSchema } from '../../utils/index.js';
import { newProvidePersonnelFromVehiclesActivityState } from '../activities/index.js';
import { addActivity } from '../activities/utils.js';
import { nextUUID } from '../utils/randomness.js';
import type { SimulationBehavior } from './simulation-behavior.js';
import { simulationBehaviorStateSchema } from './simulation-behavior.js';

export const providePersonnelBehaviorStateSchema = z.strictObject({
    ...simulationBehaviorStateSchema.shape,
    type: z.literal('providePersonnelBehavior'),
    vehicleTemplatePriorities: z.array(uuidSchema),
});

export type ProvidePersonnelBehaviorState = z.infer<
    typeof providePersonnelBehaviorStateSchema
>;

export function newProvidePersonnelBehaviorState(
    vehicleTemplatePriorities?: UUID[]
): ProvidePersonnelBehaviorState {
    return {
        type: 'providePersonnelBehavior',
        id: uuid(),
        vehicleTemplatePriorities: vehicleTemplatePriorities ?? [],
    };
}

export const providePersonnelBehavior: SimulationBehavior<ProvidePersonnelBehaviorState> =
    {
        behaviorStateSchema: providePersonnelBehaviorStateSchema,
        newBehaviorState: newProvidePersonnelBehaviorState,
        handleEvent(draftState, simulatedRegion, behaviorState, event) {
            if (
                event.type === 'resourceRequiredEvent' &&
                event.requiredResource.type === 'personnelResource'
            ) {
                addActivity(
                    simulatedRegion,
                    newProvidePersonnelFromVehiclesActivityState(
                        nextUUID(draftState),
                        event.requiredResource.personnelCounts,
                        behaviorState.vehicleTemplatePriorities,
                        event.key
                    )
                );
            }
        },
    };
