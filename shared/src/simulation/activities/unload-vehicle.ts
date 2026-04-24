import { z } from 'zod';
import { unloadVehicle } from '../utils/vehicle.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { tryGetElement } from '../../store/action-reducers/utils/get-element.js';
import { isInSpecificSimulatedRegion } from '../../models/utils/position/position-helpers.js';
import { changeOccupation } from '../../models/utils/occupations/occupation-helpers-mutable.js';
import { newNoOccupation } from '../../models/utils/occupations/no-occupation.js';
import { simulationActivityStateSchema } from './simulation-activity.js';
import type { SimulationActivity } from './simulation-activity.js';

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
