import { IsInt, IsUUID, Min } from 'class-validator';
import {
    getCreate,
    changeOccupation,
    isUnoccupied,
} from '../../models/index.js';
import type { UUID } from '../../utils/index.js';
import {
    StrictObject,
    uuid,
    uuidValidationOptions,
} from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import type { UUIDSquaredMap } from '../../utils/validators/is-uuid-uuid-map.js';
import { IsUUIDSquaredMap } from '../../utils/validators/is-uuid-uuid-map.js';
import { UnloadVehicleActivityState } from '../activities/index.js';
import { addActivity, terminateActivity } from '../activities/utils.js';
import { nextUUID } from '../utils/randomness.js';
import { tryGetElement } from '../../store/action-reducers/utils/index.js';
import type {
    SimulationBehavior,
    SimulationBehaviorState,
} from './simulation-behavior.js';

export class UnloadArrivingVehiclesBehaviorState
    implements SimulationBehaviorState
{
    @IsValue('unloadArrivingVehiclesBehavior' as const)
    readonly type = 'unloadArrivingVehiclesBehavior';

    @IsUUID(4, uuidValidationOptions)
    readonly id: UUID = uuid();

    @IsInt()
    @Min(0)
    readonly unloadDelay: number;

    @IsUUIDSquaredMap()
    readonly vehicleActivityMap: UUIDSquaredMap;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        unloadDelay: number = 2 * 60 * 1000,
        vehicleActivityMap: UUIDSquaredMap = {}
    ) {
        this.unloadDelay = unloadDelay;
        this.vehicleActivityMap = vehicleActivityMap;
    }

    static readonly create = getCreate(this);
}

export const unloadArrivingVehiclesBehavior: SimulationBehavior<UnloadArrivingVehiclesBehaviorState> =
    {
        behaviorState: UnloadArrivingVehiclesBehaviorState,
        handleEvent(draftState, simulatedRegion, behaviorState, event) {
            switch (event.type) {
                case 'tickEvent': {
                    StrictObject.entries(
                        behaviorState.vehicleActivityMap
                    ).forEach(([vehicleId, activityId]) => {
                        if (!simulatedRegion.activities[activityId]) {
                            delete behaviorState.vehicleActivityMap[vehicleId];
                        }
                    });
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
                        changeOccupation(draftState, vehicle, {
                            type: 'unloadingOccupation',
                        });
                        addActivity(
                            simulatedRegion,
                            UnloadVehicleActivityState.create(
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
