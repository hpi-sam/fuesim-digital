import { z } from 'zod';
import { addActivity, terminateActivity } from '../activities/utils.js';
import { nextUUID } from '../utils/randomness.js';
import { uuid, type UUID, uuidSchema } from '../../utils/uuid.js';
import { tryGetElement } from '../../store/action-reducers/utils/get-element.js';
import {
    changeOccupation,
    isUnoccupied,
} from '../../models/utils/occupations/occupation-helpers-mutable.js';
import { newUnloadingOccupation } from '../../models/utils/occupations/unloading-occupation.js';
import { newUnloadVehicleActivityState } from '../activities/unload-vehicle.js';
import { simulationBehaviorStateSchema } from './simulation-behavior.js';
import type { SimulationBehavior } from './simulation-behavior.js';

export const unloadArrivingVehiclesBehaviorStateSchema = z.strictObject({
    ...simulationBehaviorStateSchema.shape,
    type: z.literal('unloadArrivingVehiclesBehavior'),
    unloadDelay: z.int().nonnegative(),
    vehicleActivityMap: z.record(uuidSchema, uuidSchema),
});
export type UnloadArrivingVehiclesBehaviorState = z.infer<
    typeof unloadArrivingVehiclesBehaviorStateSchema
>;

export function newUnloadArrivingVehiclesBehaviorState(
    unloadDelay: number = 2 * 60 * 1000,
    vehicleActivityMap: { [key in UUID]: UUID } = {}
): UnloadArrivingVehiclesBehaviorState {
    return {
        id: uuid(),
        type: 'unloadArrivingVehiclesBehavior',
        unloadDelay,
        vehicleActivityMap,
    };
}

export const unloadArrivingVehiclesBehavior: SimulationBehavior<UnloadArrivingVehiclesBehaviorState> =
    {
        behaviorStateSchema: unloadArrivingVehiclesBehaviorStateSchema,
        newBehaviorState: newUnloadArrivingVehiclesBehaviorState,
        handleEvent(draftState, simulatedRegion, behaviorState, event) {
            switch (event.type) {
                case 'tickEvent': {
                    Object.entries(behaviorState.vehicleActivityMap).forEach(
                        ([vehicleId, activityId]) => {
                            if (!simulatedRegion.activities[activityId]) {
                                delete behaviorState.vehicleActivityMap[
                                    vehicleId
                                ];
                            }
                        }
                    );
                    break;
                }
                case 'vehicleArrivedEvent': {
                    const vehicle = tryGetElement(
                        draftState,
                        'vehicle',
                        event.vehicleId
                    );
                    if (vehicle && isUnoccupied(draftState, vehicle)) {
                        const activityId = nextUUID(draftState);
                        behaviorState.vehicleActivityMap[event.vehicleId] =
                            activityId;
                        changeOccupation(
                            draftState,
                            vehicle,
                            newUnloadingOccupation()
                        );
                        addActivity(
                            simulatedRegion,
                            newUnloadVehicleActivityState(
                                activityId,
                                event.vehicleId,
                                event.arrivalTime,
                                behaviorState.unloadDelay
                            )
                        );
                    }
                    break;
                }
                case 'vehicleRemovedEvent': {
                    const activityId =
                        behaviorState.vehicleActivityMap[event.vehicleId];
                    if (activityId) {
                        terminateActivity(
                            draftState,
                            simulatedRegion,
                            activityId
                        );
                        delete behaviorState.vehicleActivityMap[
                            event.vehicleId
                        ];
                    }
                    break;
                }
                default:
                    break;
            }
        },
    };
