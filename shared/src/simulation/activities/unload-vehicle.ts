import { IsInt, IsUUID, Min } from 'class-validator';
import {
    changeOccupation,
    getCreate,
    isInSpecificSimulatedRegion,
} from '../../models/utils/index.js';
import { NoOccupation } from '../../models/utils/occupations/no-occupation.js';
import type { UUID } from '../../utils/index.js';
import { uuidValidationOptions } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import { unloadVehicle } from '../utils/vehicle.js';
import { tryGetElement } from '../../store/action-reducers/utils/index.js';
import type {
    SimulationActivity,
    SimulationActivityState,
} from './simulation-activity.js';

export class UnloadVehicleActivityState implements SimulationActivityState {
    @IsValue('unloadVehicleActivity' as const)
    public readonly type = 'unloadVehicleActivity';

    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId: UUID;

    @IsInt()
    @Min(0)
    public readonly startTime: number;

    @IsInt()
    @Min(0)
    public readonly duration: number;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        id: UUID,
        vehicleId: UUID,
        startTime: number,
        duration: number
    ) {
        this.vehicleId = vehicleId;
        this.startTime = startTime;
        this.duration = duration;
        this.id = id;
    }

    static readonly create = getCreate(this);
}

// Because this activity relies on a cancel condition, we cannot model it as a DelayEventActivity
export const unloadVehicleActivity: SimulationActivity<UnloadVehicleActivityState> =
    {
        activityState: UnloadVehicleActivityState,
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
                changeOccupation(draftState, vehicle, NoOccupation.create());
            }
        },
    };
