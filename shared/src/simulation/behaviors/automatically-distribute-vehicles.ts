import { cloneDeep } from 'lodash-es';
import type { WritableDraft } from 'immer';
import { z } from 'zod';
import { nextUUID } from '../utils/randomness.js';
import { uuidSetSchema } from '../../utils/uuid-set.js';
import { resourceDescriptionSchema } from '../../models/utils/resource-description.js';
import type { UUID } from '../../utils/uuid.js';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import { addActivity } from '../activities/utils.js';
import { newRecurringEventActivityState } from '../activities/recurring-event.js';
import { newTryToDistributeEvent } from '../events/try-to-distribute.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { newDelayEventActivityState } from '../activities/delay-event.js';
import { newTransferVehiclesRequestEvent } from '../events/transfer-vehicles-request.js';
import { simulationBehaviorStateSchema } from './simulation-behavior.js';
import type { SimulationBehavior } from './simulation-behavior.js';

export const automaticallyDistributeVehiclesBehaviorStateSchema =
    z.strictObject({
        ...simulationBehaviorStateSchema.shape,
        type: z.literal('automaticallyDistributeVehiclesBehavior'),
        distributionDestinations: uuidSetSchema,
        distributionLimits: resourceDescriptionSchema,
        distributedRounds: resourceDescriptionSchema,
        distributedLastRound: resourceDescriptionSchema,
        remainingInNeed: z.record(z.string(), uuidSetSchema),
        /**
         * This *MUST* be greater than about 10 tick durations to ensure that we can wait for a response
         */
        distributionDelay: z.int().min(1),
        recurringActivityId: uuidSchema.optional(),
    });

export type AutomaticallyDistributeVehiclesBehaviorState = z.infer<
    typeof automaticallyDistributeVehiclesBehaviorStateSchema
>;

export function newAutomaticallyDistributeVehiclesBehaviorState(): AutomaticallyDistributeVehiclesBehaviorState {
    return {
        type: 'automaticallyDistributeVehiclesBehavior',
        id: uuid(),
        distributionDestinations: {},
        distributionLimits: {},
        distributedRounds: {},
        distributedLastRound: {},
        remainingInNeed: {},
        distributionDelay: 60_000, // 1 minute
        recurringActivityId: undefined,
    };
}

export const automaticallyDistributeVehiclesBehavior: SimulationBehavior<AutomaticallyDistributeVehiclesBehaviorState> =
    {
        behaviorStateSchema: automaticallyDistributeVehiclesBehaviorStateSchema,
        newBehaviorState: newAutomaticallyDistributeVehiclesBehaviorState,
        handleEvent: (draftState, simulatedRegion, behaviorState, event) => {
            switch (event.type) {
                case 'tickEvent': {
                    if (!behaviorState.recurringActivityId) {
                        // initialize recurring activity
                        behaviorState.recurringActivityId =
                            nextUUID(draftState);
                        addActivity(
                            simulatedRegion,
                            newRecurringEventActivityState(
                                behaviorState.recurringActivityId,
                                newTryToDistributeEvent(behaviorState.id),
                                draftState.currentTime,
                                behaviorState.distributionDelay
                            )
                        );
                    }
                    break;
                }
                case 'tryToDistributeEvent':
                    {
                        // Ignore the event if it is not meant for this behavior

                        if (event.behaviorId !== behaviorState.id) {
                            return;
                        }

                        // Don't do anything until there is a region to distribute to

                        if (
                            Object.keys(behaviorState.distributionDestinations)
                                .length === 0
                        ) {
                            return;
                        }

                        // Check for completed rounds

                        Object.entries(behaviorState.remainingInNeed).forEach(
                            ([vehicleType, regionsInNeed]) => {
                                if (Object.keys(regionsInNeed).length === 0) {
                                    behaviorState.distributedRounds[
                                        vehicleType
                                    ] ??= 0;

                                    // Check if a vehicle was distributed during the last distribution try
                                    // to not increase the distributed rounds if all transfer connections were missing

                                    if (
                                        (behaviorState.distributedLastRound[
                                            vehicleType
                                        ] ?? 0) > 0
                                    ) {
                                        behaviorState.distributedRounds[
                                            vehicleType
                                        ]++;
                                    }

                                    behaviorState.remainingInNeed[vehicleType] =
                                        behaviorState.distributionDestinations;
                                }
                                behaviorState.distributedLastRound[
                                    vehicleType
                                ] = 0;
                            }
                        );

                        // distribute

                        const regionsOrderedByNeed = Object.keys(
                            cloneDeepMutable(
                                behaviorState.distributionDestinations
                            )
                        );
                        regionsOrderedByNeed.sort(
                            (regionIdA, regionIdB) =>
                                numberOfDifferentVehiclesNeeded(
                                    behaviorState,
                                    regionIdB
                                ) -
                                numberOfDifferentVehiclesNeeded(
                                    behaviorState,
                                    regionIdA
                                )
                        );

                        const vehiclesToBeSent: {
                            [region: UUID]: { [vehicletype: string]: 1 };
                        } = {};

                        Object.entries(behaviorState.remainingInNeed).forEach(
                            ([vehicleType, regionsInNeed]) => {
                                if (
                                    distributionLimitOfVehicleTypeReached(
                                        behaviorState,
                                        vehicleType
                                    )
                                ) {
                                    return;
                                }

                                Object.keys(regionsInNeed).forEach((region) => {
                                    vehiclesToBeSent[region] ??= {};
                                    vehiclesToBeSent[region][vehicleType] = 1;
                                });
                            }
                        );

                        regionsOrderedByNeed.forEach((region) => {
                            if (!vehiclesToBeSent[region]) {
                                return;
                            }
                            addActivity(
                                simulatedRegion,
                                newDelayEventActivityState(
                                    nextUUID(draftState),
                                    newTransferVehiclesRequestEvent(
                                        cloneDeep(vehiclesToBeSent[region]),
                                        'transferPoint',
                                        region,
                                        simulatedRegion.id,
                                        'automatic-distribution'
                                    ),
                                    draftState.currentTime
                                )
                            );
                        });
                    }
                    break;
                case 'transferConnectionMissingEvent':
                    {
                        // If a connection is missing the vehicle counts as sent

                        Object.entries(behaviorState.remainingInNeed).forEach(
                            ([vehicleType, regionsInNeed]) => {
                                if (
                                    distributionLimitOfVehicleTypeReached(
                                        behaviorState,
                                        vehicleType
                                    )
                                ) {
                                    return;
                                }
                                delete regionsInNeed[event.transferPointId];
                            }
                        );
                    }
                    break;
                case 'requestReceivedEvent':
                    {
                        if (event.key !== 'automatic-distribution') {
                            return;
                        }

                        Object.entries(event.availableVehicles).forEach(
                            ([vehicleType, vehicleAmount]) => {
                                if (vehicleAmount === 0) {
                                    return;
                                }
                                behaviorState.distributedLastRound[
                                    vehicleType
                                ] ??= 0;
                                behaviorState.distributedLastRound[
                                    vehicleType
                                ]++;

                                if (
                                    behaviorState.remainingInNeed[vehicleType]
                                ) {
                                    delete behaviorState.remainingInNeed[
                                        vehicleType
                                    ][event.transferDestinationId];
                                }
                            }
                        );
                    }
                    break;

                default:
                // Ignore event
            }
        },
    };

function distributionLimitOfVehicleTypeReached(
    behaviorState: WritableDraft<AutomaticallyDistributeVehiclesBehaviorState>,
    vehicleType: string
) {
    return (
        (behaviorState.distributedRounds[vehicleType] ?? 0) >=
        (behaviorState.distributionLimits[vehicleType] ?? 0)
    );
}

function numberOfDifferentVehiclesNeeded(
    behaviorState: WritableDraft<AutomaticallyDistributeVehiclesBehaviorState>,
    regionId: string
) {
    return Object.values(behaviorState.remainingInNeed).reduce(
        (numberOfVehiclesNeededByRegion, regionsInNeed) => {
            if (regionsInNeed[regionId]) {
                return numberOfVehiclesNeededByRegion + 1;
            }
            return numberOfVehiclesNeededByRegion;
        },
        0
    );
}
