import {
    IsInt,
    IsOptional,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { groupBy } from 'lodash-es';
import { Type } from 'class-transformer';
import {
    VehicleResource,
    currentSimulatedRegionOf,
    getCreate,
    isInSimulatedRegion,
    isInSpecificSimulatedRegion,
    changeOccupation,
    isUnoccupied,
    isUnoccupiedOrIntermediarilyOccupied,
} from '../../models/index.js';
import type { UUID } from '../../utils/index.js';
import {
    cloneDeepMutable,
    uuid,
    uuidValidationOptions,
} from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import { addActivity, terminateActivity } from '../activities/utils.js';
import { nextUUID } from '../utils/randomness.js';
import {
    getElement,
    tryGetElement,
} from '../../store/action-reducers/utils/index.js';
import {
    DelayEventActivityState,
    LoadVehicleActivityState,
    RecurringEventActivityState,
    SendRemoteEventActivityState,
    TransferVehicleActivityState,
} from '../activities/index.js';
import { amountOfResourcesInVehicle } from '../../models/utils/amount-of-resources-in-vehicle.js';
import type { ResourceDescription } from '../../models/index.js';
import {
    DoTransferEvent,
    RequestReceivedEvent,
    StartTransferEvent,
    VehiclesSentEvent,
} from '../events/index.js';
import type {
    SimulationBehavior,
    SimulationBehaviorState,
} from './simulation-behavior.js';

export class TransferBehaviorState implements SimulationBehaviorState {
    @IsValue('transferBehavior' as const)
    readonly type = 'transferBehavior';

    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsInt()
    @Min(0)
    public readonly loadTimePerPatient: number;

    @IsInt()
    @Min(0)
    public readonly personnelLoadTime: number;

    @IsInt()
    @Min(0)
    public readonly delayBetweenSends: number;

    @Type(() => StartTransferEvent)
    @ValidateNested()
    public readonly startTransferEventQueue: readonly StartTransferEvent[] = [];

    @IsUUID(4, uuidValidationOptions)
    @IsOptional()
    public readonly recurringActivityId: UUID | undefined;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        loadTimePerPatient: number = 60_000, // 1 minute
        personnelLoadTime: number = 120_000, // 2 minutes
        delayBetweenSends: number = 60_000 // 1 minute
    ) {
        this.loadTimePerPatient = loadTimePerPatient;
        this.personnelLoadTime = personnelLoadTime;
        this.delayBetweenSends = delayBetweenSends;
    }

    static readonly create = getCreate(this);
}

export const transferBehavior: SimulationBehavior<TransferBehaviorState> = {
    behaviorState: TransferBehaviorState,
    handleEvent(draftState, simulatedRegion, behaviorState, event) {
        switch (event.type) {
            case 'transferPatientsRequestEvent':
                {
                    // find a vehicle to use

                    const vehicles = Object.values(draftState.vehicles)
                        .filter((vehicle) =>
                            isInSpecificSimulatedRegion(
                                vehicle,
                                simulatedRegion.id
                            )
                        )
                        .filter(
                            (vehicle) =>
                                Object.keys(vehicle.patientIds).length === 0
                        );
                    const vehiclesOfCorrectType = vehicles.filter(
                        (vehicle) => vehicle.type === event.vehicleType
                    );

                    // sort the unoccupied vehicles by number of loaded resources descending and use the one with the most

                    const vehicleToLoad = vehiclesOfCorrectType
                        .filter((vehicle) => isUnoccupied(draftState, vehicle))
                        .sort(
                            (vehicle1, vehicle2) =>
                                amountOfResourcesInVehicle(
                                    draftState,
                                    vehicle2.id
                                ) -
                                amountOfResourcesInVehicle(
                                    draftState,
                                    vehicle1.id
                                )
                        )[0];

                    if (vehicleToLoad) {
                        const activityId = nextUUID(draftState);
                        addActivity(
                            simulatedRegion,
                            LoadVehicleActivityState.create(
                                activityId,
                                vehicleToLoad.id,
                                event.transferDestinationType,
                                event.transferDestinationId,
                                event.patientIds,
                                behaviorState.loadTimePerPatient,
                                behaviorState.personnelLoadTime
                            )
                        );
                        changeOccupation(draftState, vehicleToLoad, {
                            type: 'loadOccupation',
                            loadingActivityId: activityId,
                        });
                    }
                }
                break;
            case 'transferPatientsInSpecificVehicleRequestEvent':
                {
                    const vehicle = tryGetElement(
                        draftState,
                        'vehicle',
                        event.vehicleId
                    );
                    // Don't do anything if vehicle is occupied
                    if (
                        vehicle === undefined ||
                        !isUnoccupiedOrIntermediarilyOccupied(
                            draftState,
                            vehicle
                        )
                    ) {
                        break;
                    }

                    const activityId = nextUUID(draftState);
                    addActivity(
                        simulatedRegion,
                        LoadVehicleActivityState.create(
                            activityId,
                            vehicle.id,
                            event.transferDestinationType,
                            event.transferDestinationId,
                            event.patientIds,
                            behaviorState.loadTimePerPatient,
                            behaviorState.personnelLoadTime
                        )
                    );
                    changeOccupation(draftState, vehicle, {
                        type: 'loadOccupation',
                        loadingActivityId: activityId,
                    });
                }
                break;
            case 'transferSpecificVehicleRequestEvent':
                {
                    const vehicle = tryGetElement(
                        draftState,
                        'vehicle',
                        event.vehicleId
                    );
                    // Don't do anything if vehicle is occupied
                    if (
                        vehicle === undefined ||
                        !isUnoccupied(draftState, vehicle)
                    ) {
                        break;
                    }

                    const activityId = nextUUID(draftState);
                    addActivity(
                        simulatedRegion,
                        LoadVehicleActivityState.create(
                            activityId,
                            vehicle.id,
                            event.transferDestinationType,
                            event.transferDestinationId,
                            {},
                            behaviorState.loadTimePerPatient,
                            behaviorState.personnelLoadTime,
                            undefined,
                            event.successorOccupation
                        )
                    );
                    changeOccupation(draftState, vehicle, {
                        type: 'loadOccupation',
                        loadingActivityId: activityId,
                    });
                }
                break;
            case 'transferVehiclesRequestEvent':
                {
                    // group vehicles

                    const vehicles = Object.values(draftState.vehicles)
                        .filter((vehicle) =>
                            isInSpecificSimulatedRegion(
                                vehicle,
                                simulatedRegion.id
                            )
                        )
                        .filter(
                            (vehicle) =>
                                Object.keys(vehicle.patientIds).length === 0
                        );
                    const groupedVehicles = groupBy(
                        vehicles,
                        (vehicle) => vehicle.vehicleType
                    );

                    const sentVehicles: ResourceDescription = {};

                    Object.entries(event.requestedVehicles).forEach(
                        ([vehicleType, vehicleAmount]) => {
                            // sort the unoccupied vehicles by number of loaded resources descending and use the one with the most

                            const loadableVehicles = groupedVehicles[
                                vehicleType
                            ]
                                ?.filter((vehicle) =>
                                    isUnoccupied(draftState, vehicle)
                                )
                                .sort(
                                    (vehicle1, vehicle2) =>
                                        amountOfResourcesInVehicle(
                                            draftState,
                                            vehicle2.id
                                        ) -
                                        amountOfResourcesInVehicle(
                                            draftState,
                                            vehicle1.id
                                        )
                                );

                            sentVehicles[vehicleType] = 0;

                            for (
                                let index = 0;
                                index <
                                Math.min(
                                    loadableVehicles?.length ?? 0,
                                    vehicleAmount
                                );
                                index++
                            ) {
                                const activityId = nextUUID(draftState);
                                addActivity(
                                    simulatedRegion,
                                    LoadVehicleActivityState.create(
                                        activityId,
                                        loadableVehicles![index]!.id,
                                        event.transferDestinationType,
                                        event.transferDestinationId,
                                        {},
                                        behaviorState.loadTimePerPatient,
                                        behaviorState.personnelLoadTime,
                                        undefined,
                                        cloneDeepMutable(
                                            event.successorOccupation
                                        )
                                    )
                                );
                                changeOccupation(
                                    draftState,
                                    loadableVehicles![index]!,
                                    {
                                        type: 'loadOccupation',
                                        loadingActivityId: activityId,
                                    }
                                );
                                sentVehicles[vehicleType]++;
                            }
                        }
                    );

                    // Send RequestReceivedEvent into own region

                    addActivity(
                        simulatedRegion,
                        DelayEventActivityState.create(
                            nextUUID(draftState),
                            RequestReceivedEvent.create(
                                sentVehicles,
                                event.transferDestinationType,
                                event.transferDestinationId,
                                event.key
                            ),
                            draftState.currentTime
                        )
                    );

                    // Send event to transfer initiating region

                    if (event.transferInitiatingRegionId) {
                        addActivity(
                            simulatedRegion,
                            SendRemoteEventActivityState.create(
                                nextUUID(draftState),
                                event.transferInitiatingRegionId,
                                VehiclesSentEvent.create(
                                    VehicleResource.create(sentVehicles),
                                    event.transferDestinationId,
                                    event.key
                                )
                            )
                        );
                    }

                    // Send event to destination if it is a simulated region and not the initiating region
                    if (event.transferDestinationType === 'transferPoint') {
                        const transferPoint = getElement(
                            draftState,
                            'transferPoint',
                            event.transferDestinationId
                        );

                        if (isInSimulatedRegion(transferPoint)) {
                            const targetSimulatedRegion =
                                currentSimulatedRegionOf(
                                    draftState,
                                    getElement(
                                        draftState,
                                        'transferPoint',
                                        event.transferDestinationId
                                    )
                                );

                            if (
                                targetSimulatedRegion.id !==
                                event.transferInitiatingRegionId
                            ) {
                                addActivity(
                                    simulatedRegion,
                                    SendRemoteEventActivityState.create(
                                        nextUUID(draftState),
                                        targetSimulatedRegion.id,
                                        VehiclesSentEvent.create(
                                            VehicleResource.create(
                                                sentVehicles
                                            ),
                                            transferPoint.id
                                        )
                                    )
                                );
                            }
                        }
                    }
                }
                break;
            case 'startTransferEvent':
                {
                    const vehicle = tryGetElement(
                        draftState,
                        'vehicle',
                        event.vehicleId
                    );
                    if (vehicle === undefined) {
                        break;
                    }
                    changeOccupation(draftState, vehicle, {
                        type: 'waitForTransferOccupation',
                    });

                    behaviorState.startTransferEventQueue.push(event);
                }
                break;
            case 'tickEvent':
                {
                    if (
                        behaviorState.recurringActivityId === undefined &&
                        behaviorState.startTransferEventQueue.length !== 0
                    ) {
                        behaviorState.recurringActivityId =
                            nextUUID(draftState);
                        addActivity(
                            simulatedRegion,
                            RecurringEventActivityState.create(
                                behaviorState.recurringActivityId,
                                DoTransferEvent.create(),
                                draftState.currentTime,
                                behaviorState.delayBetweenSends
                            )
                        );
                    }
                }
                break;
            case 'doTransferEvent':
                {
                    const transferEvent =
                        behaviorState.startTransferEventQueue.shift();
                    if (transferEvent === undefined) {
                        if (behaviorState.recurringActivityId) {
                            terminateActivity(
                                draftState,
                                simulatedRegion,
                                behaviorState.recurringActivityId
                            );
                            behaviorState.recurringActivityId = undefined;
                            break;
                        }
                    } else {
                        const vehicle = tryGetElement(
                            draftState,
                            'vehicle',
                            transferEvent.vehicleId
                        );
                        if (
                            vehicle?.occupation.type !==
                            'waitForTransferOccupation'
                        ) {
                            break;
                        }
                        addActivity(
                            simulatedRegion,
                            TransferVehicleActivityState.create(
                                nextUUID(draftState),
                                vehicle.id,
                                transferEvent.transferDestinationType,
                                transferEvent.transferDestinationId,
                                transferEvent.key,
                                cloneDeepMutable(
                                    transferEvent.successorOccupation
                                )
                            )
                        );
                    }
                }
                break;
            default:
            // ignore event
        }
    },
};
