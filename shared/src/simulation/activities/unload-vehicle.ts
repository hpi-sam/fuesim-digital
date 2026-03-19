import { z } from 'zod';
import {
    changeOccupation,
    isInSpecificSimulatedRegion,
    newNoOccupation,
} from '../../models/index.js';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import { unloadVehicle } from '../utils/vehicle.js';
import { tryGetElement } from '../../store/action-reducers/utils/index.js';
import type { SimulationActivity } from './simulation-activity.js';
import { simulationActivityStateSchema } from './simulation-activity.js';

export const unloadVehicleActivityStateSchema = z.strictObject({
    ...simulationActivityStateSchema.shape,
    type: z.literal('unloadVehicleActivity'),
    vehicleId: uuidSchema,
    startTime: z.int().nonnegative(),
    duration: z.int().nonnegative(),
});
export type UnloadVehicleActivityState = z.infer<
    typeof unloadVehicleActivityStateSchema
>;

export function newUnloadVehicleActivityState(
    id: UUID,
    vehicleId: UUID,
    startTime: number,
    duration: number
): UnloadVehicleActivityState {
    return {
        id,
        type: 'unloadVehicleActivity',
        vehicleId,
        startTime,
        duration,
    };
}

// Because this activity relies on a cancel condition, we cannot model it as a DelayEventActivity
export const unloadVehicleActivity: SimulationActivity<UnloadVehicleActivityState> =
    {
        activityStateSchema: unloadVehicleActivityStateSchema,
        tick(
            draftState,
            simulatedRegion,
            activityState,
            _tickInterval,
            terminate
        ) {
            const vehicle = tryGetElement(
                draftState,
                'vehicle',
                activityState.vehicleId
            );
            if (
                !vehicle ||
                !isInSpecificSimulatedRegion(vehicle, simulatedRegion.id) ||
                !(vehicle.occupation.type === 'unloadingOccupation')
            ) {
                terminate();
            } else if (
                draftState.currentTime >=
                activityState.startTime + activityState.duration
            ) {
                unloadVehicle(draftState, simulatedRegion, vehicle);
                terminate();
            }
        },
        onTerminate(draftState, simulatedRegion, activityId) {
            const activity = simulatedRegion.activities[
                activityId
            ] as UnloadVehicleActivityState;
            const vehicle = tryGetElement(
                draftState,
                'vehicle',
                activity.vehicleId
            );
            if (vehicle?.occupation.type === 'unloadingOccupation') {
                changeOccupation(draftState, vehicle, newNoOccupation());
            }
        },
    };
