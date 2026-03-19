import { z } from 'zod';
import type { WritableDraft } from 'immer';
import {
    cloneDeepMutable,
    StrictObject,
    uuid,
    uuidSchema,
} from '../../utils/index.js';
import {
    getActivityById,
    tryGetElement,
} from '../../store/action-reducers/utils/index.js';
import type { ExerciseState } from '../../state.js';
import { addActivity } from '../activities/utils.js';
import { nextUUID } from '../utils/randomness.js';
import { newRecurringEventActivityState } from '../activities/index.js';
import { newSendRequestEvent } from '../events/send-request.js';
import { newCreateRequestActivityState } from '../activities/create-request.js';
import {
    newVehicleResource,
    vehicleResourceSchema,
    exerciseRequestTargetConfigurationSchema,
    newTraineesRequestTargetConfiguration,
    addPartialResourceDescriptions,
    subtractPartialResourceDescriptions,
} from '../../models/index.js';
import type {
    ExerciseRequestTargetConfiguration,
    SimulatedRegion,
    ResourceDescription,
} from '../../models/index.js';
import {
    newResourcePromise,
    resourcePromiseSchema,
} from '../utils/resource-promise.js';
import type { ResourceRequestRadiogram } from '../../models/radiogram/index.js';
import type { SimulationBehavior } from './simulation-behavior.js';
import { simulationBehaviorStateSchema } from './simulation-behavior.js';

export const requestBehaviorStateSchema = z.strictObject({
    ...simulationBehaviorStateSchema.shape,
    type: z.literal('requestBehavior'),
    recurringEventActivityId: uuidSchema.optional(),
    requestedResources: z.record(z.string(), vehicleResourceSchema),
    promisedResources: z.array(resourcePromiseSchema),
    /**
     * @deprecated Use {@link updateBehaviorsRequestInterval} instead
     */
    requestInterval: z.number().int().nonnegative(),
    invalidatePromiseInterval: z.number().int().nonnegative(),
    requestTarget: exerciseRequestTargetConfigurationSchema,
});

export type RequestBehaviorState = z.infer<typeof requestBehaviorStateSchema>;

export function newRequestBehaviorState(): RequestBehaviorState {
    return {
        type: 'requestBehavior',
        id: uuid(),
        recurringEventActivityId: undefined,
        requestedResources: {},
        promisedResources: [],
        requestInterval: 1000 * 60 * 5,
        invalidatePromiseInterval: 1000 * 60 * 30,
        requestTarget: newTraineesRequestTargetConfiguration(),
    };
}

export const requestBehavior: SimulationBehavior<RequestBehaviorState> = {
    behaviorStateSchema: requestBehaviorStateSchema,
    newBehaviorState: newRequestBehaviorState,
    handleEvent(draftState, simulatedRegion, behaviorState, event) {
        switch (event.type) {
            case 'tickEvent': {
                if (!behaviorState.recurringEventActivityId) {
                    behaviorState.recurringEventActivityId =
                        nextUUID(draftState);
                    addActivity(
                        simulatedRegion,
                        newRecurringEventActivityState(
                            behaviorState.recurringEventActivityId,
                            newSendRequestEvent(),
                            draftState.currentTime,
                            behaviorState.requestInterval
                        )
                    );
                }
                break;
            }
            case 'resourceRequiredEvent': {
                if (
                    event.requiringSimulatedRegionId === simulatedRegion.id &&
                    event.requiredResource.type === 'vehicleResource'
                ) {
                    behaviorState.requestedResources[event.key] =
                        event.requiredResource;
                }
                break;
            }
            case 'vehiclesSentEvent': {
                behaviorState.promisedResources.push(
                    cloneDeepMutable(
                        newResourcePromise(
                            draftState.currentTime,
                            event.vehiclesSent
                        )
                    )
                );
                break;
            }
            case 'vehicleArrivedEvent': {
                const vehicle = tryGetElement(
                    draftState,
                    'vehicle',
                    event.vehicleId
                );
                if (vehicle === undefined) {
                    break;
                }
                let arrivedResourceDescription: Partial<ResourceDescription> = {
                    [vehicle.vehicleType]: 1,
                };
                behaviorState.promisedResources.forEach((promise) => {
                    const remainingResources =
                        subtractPartialResourceDescriptions(
                            arrivedResourceDescription,
                            promise.resource.vehicleCounts
                        );

                    promise.resource.vehicleCounts =
                        subtractPartialResourceDescriptions(
                            promise.resource.vehicleCounts,
                            arrivedResourceDescription
                        ) as ResourceDescription;

                    arrivedResourceDescription = remainingResources;
                });
                behaviorState.promisedResources =
                    behaviorState.promisedResources.filter(
                        (promise) =>
                            Object.keys(promise.resource.vehicleCounts).length >
                            0
                    );

                behaviorState.requestedResources = {};
                break;
            }
            case 'sendRequestEvent': {
                const resourcesToRequest = getResourcesToRequest(
                    draftState,
                    behaviorState
                );
                const resource = newVehicleResource(
                    resourcesToRequest as ResourceDescription
                );
                addActivity(
                    simulatedRegion,
                    newCreateRequestActivityState(
                        nextUUID(draftState),
                        behaviorState.requestTarget,
                        resource,
                        requestBehaviorKey(simulatedRegion)
                    )
                );
                break;
            }
            case 'collectInformationEvent': {
                switch (event.informationType) {
                    case 'requiredResources': {
                        const radiogram = getActivityById(
                            draftState,
                            simulatedRegion.id,
                            event.generateReportActivityId,
                            'generateReportActivity'
                        ).radiogram as WritableDraft<ResourceRequestRadiogram>;

                        const requiredResources =
                            getRequiredResources(behaviorState);
                        const alreadyPromisedResources = getPromisedResources(
                            draftState,
                            behaviorState
                        );
                        radiogram.requiredResource = cloneDeepMutable(
                            newVehicleResource(
                                requiredResources as ResourceDescription
                            )
                        );
                        radiogram.alreadyPromisedResource = cloneDeepMutable(
                            newVehicleResource(
                                alreadyPromisedResources as ResourceDescription
                            )
                        );
                        radiogram.informationAvailable = true;
                        radiogram.canBeGranted = false;
                        break;
                    }
                    default:
                    // Ignore event
                }
                break;
            }
            default:
                break;
        }
    },
    onRemove(draftState, simulatedRegion, behaviorState) {
        addActivity(
            simulatedRegion,
            newCreateRequestActivityState(
                nextUUID(draftState),
                behaviorState.requestTarget,
                newVehicleResource({}),
                requestBehaviorKey(simulatedRegion)
            )
        );
    },
};

function requestBehaviorKey(simulatedRegion: WritableDraft<SimulatedRegion>) {
    return `${simulatedRegion.id}-request`;
}

export function updateBehaviorsRequestTarget(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    behaviorState: WritableDraft<RequestBehaviorState>,
    requestTarget: ExerciseRequestTargetConfiguration
) {
    addActivity(
        simulatedRegion,
        newCreateRequestActivityState(
            nextUUID(draftState),
            behaviorState.requestTarget,
            newVehicleResource({}),
            requestBehaviorKey(simulatedRegion)
        )
    );
    behaviorState.requestTarget = cloneDeepMutable(requestTarget);
}

export function updateBehaviorsRequestInterval(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    behaviorState: WritableDraft<RequestBehaviorState>,
    requestInterval: number
) {
    if (behaviorState.recurringEventActivityId) {
        const activity = getActivityById(
            draftState,
            simulatedRegion.id,
            behaviorState.recurringEventActivityId,
            'recurringEventActivity'
        );
        activity.recurrenceIntervalTime = requestInterval;
    }
    behaviorState.requestInterval = requestInterval;
}

function getRequiredResources(
    behaviorState: WritableDraft<RequestBehaviorState>
) {
    return addPartialResourceDescriptions(
        StrictObject.values(behaviorState.requestedResources).map(
            (resource) => resource.vehicleCounts
        )
    );
}

function getPromisedResources(
    draftState: WritableDraft<ExerciseState>,
    behaviorState: WritableDraft<RequestBehaviorState>
) {
    // remove invalidated resources
    let firstValidIndex = behaviorState.promisedResources.findIndex(
        (promise) =>
            promise.promisedTime + behaviorState.invalidatePromiseInterval >
            draftState.currentTime
    );
    if (firstValidIndex === -1)
        firstValidIndex = behaviorState.promisedResources.length;
    behaviorState.promisedResources.splice(0, firstValidIndex);

    return addPartialResourceDescriptions(
        behaviorState.promisedResources.map(
            (promise) => promise.resource.vehicleCounts
        )
    );
}

export function getResourcesToRequest(
    draftState: WritableDraft<ExerciseState>,
    behaviorState: WritableDraft<RequestBehaviorState>
) {
    const requestedResources = getRequiredResources(behaviorState);
    const promisedResources = getPromisedResources(draftState, behaviorState);

    return subtractPartialResourceDescriptions(
        requestedResources,
        promisedResources
    );
}
