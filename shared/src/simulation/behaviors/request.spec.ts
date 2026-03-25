import { produce, type WritableDraft } from 'immer';
import {
    newImageProperties,
    newMapCoordinatesAt,
    newNoOccupation,
    newSimulatedRegionPositionIn,
    newSize,
    newTransferPoint,
    SimulatedRegion,
    SimulatedRegionRequestTargetConfiguration,
    VehicleResource,
} from '../../models/index.js';
import { ExerciseState } from '../../state.js';
import {
    ResourceRequiredEvent,
    VehicleArrivedEvent,
    VehiclesSentEvent,
} from '../events/index.js';
import { cloneDeepMutable, StrictObject, uuid } from '../../utils/index.js';
import { sendSimulationEvent } from '../events/utils.js';
import { handleSimulationEvents } from '../utils/simulation.js';
import { RecurringEventActivityState } from '../activities/index.js';
import { addActivity } from '../activities/utils.js';
import { SendRequestEvent } from '../events/send-request.js';
import { ResourcePromise } from '../utils/resource-promise.js';
import { newVehicle } from '../../models/vehicle.js';
import type { ParticipantKey } from '../../exercise-keys.js';
import {
    RequestBehaviorState,
    getResourcesToRequest,
    updateBehaviorsRequestInterval,
    updateBehaviorsRequestTarget,
} from './request.js';

// constants
const emptyState = ExerciseState.create('123456' as ParticipantKey);
const currentTime = 12345;
const requestKey = 'initial-request';
const oldTime = currentTime - 100;
const newRequestInterval = 1000;
const newInvalidationInterval = 1;

// partial states
const withoutKTWPromise = [
    'withoutRequestsAndPromises',
    'withRequests',
    'withPromiseOfOtherType',
] as const;
const withOneKTWPromised = [
    'withPromises',
    'withOldPromises',
    'withRequestsAndEnoughPromises',
    'withRequestsAndNotEnoughPromises',
    'withPromisesOfMultipleTypes',
] as const;

const withOneKTWRequired = [
    'withRequests',
    'withRequestsAndNotEnoughPromises',
] as const;
const withoutOldTime = [
    'withoutRequestsAndPromises',
    'withRequests',
    'withPromises',
    'withRequestsAndEnoughPromises',
    'withRequestsAndNotEnoughPromises',
    'withPromiseOfOtherType',
    'withPromisesOfMultipleTypes',
] as const;

const withOldTime = ['withOldPromises', 'withOldAndNewPromises'] as const;

// helper functions
function setupStateAndInteract(
    initializeRequestsAndPromises: (
        state: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => void,
    interaction: (
        state: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => void
) {
    const simulatedRegion = SimulatedRegion.create(
        newMapCoordinatesAt(0, 0),
        newSize(10, 10),
        'test region'
    );
    const transferPoint = newTransferPoint(
        newSimulatedRegionPositionIn(simulatedRegion.id),
        '',
        `[Simuliert] test region`
    );

    const beforeState = produce(emptyState, (draftState) => {
        draftState.simulatedRegions[simulatedRegion.id] =
            cloneDeepMutable(simulatedRegion);
        draftState.simulatedRegions[simulatedRegion.id]?.behaviors.push(
            cloneDeepMutable(RequestBehaviorState.create())
        );
        draftState.transferPoints[transferPoint.id] =
            cloneDeepMutable(transferPoint);

        draftState.currentTime = currentTime;

        const mutableSimulatedRegion =
            draftState.simulatedRegions[simulatedRegion.id]!;
        const behaviorState = mutableSimulatedRegion
            .behaviors[0] as WritableDraft<RequestBehaviorState>;
        behaviorState.recurringEventActivityId = uuid();
        addActivity(
            mutableSimulatedRegion,
            RecurringEventActivityState.create(
                behaviorState.recurringEventActivityId,
                SendRequestEvent.create(),
                draftState.currentTime,
                behaviorState.requestInterval
            )
        );
        initializeRequestsAndPromises(
            draftState,
            mutableSimulatedRegion,
            behaviorState
        );
    });

    const afterState = produce(beforeState, (draftState) => {
        const mutableSimulatedRegion =
            draftState.simulatedRegions[simulatedRegion.id]!;
        interaction(
            draftState,
            mutableSimulatedRegion,
            mutableSimulatedRegion
                .behaviors[0] as WritableDraft<RequestBehaviorState>
        );
        handleSimulationEvents(draftState, mutableSimulatedRegion);
    });

    const beforeSimulatedRegion =
        beforeState.simulatedRegions[simulatedRegion.id]!;
    const afterSimulatedRegion =
        afterState.simulatedRegions[simulatedRegion.id]!;
    const beforeBehaviorState = beforeSimulatedRegion
        .behaviors[0] as RequestBehaviorState;
    const afterBehaviorState = afterSimulatedRegion
        .behaviors[0] as RequestBehaviorState;
    return {
        beforeState,
        afterState,
        beforeSimulatedRegion,
        afterSimulatedRegion,
        beforeBehaviorState,
        afterBehaviorState,
    };
}

function updateRequestInterval(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    behaviorState: WritableDraft<RequestBehaviorState>
) {
    updateBehaviorsRequestInterval(
        draftState,
        simulatedRegion,
        behaviorState,
        newRequestInterval
    );
}

function updateRequestTarget(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    behaviorState: WritableDraft<RequestBehaviorState>
) {
    const otherSimulatedRegion = cloneDeepMutable(
        SimulatedRegion.create(
            newMapCoordinatesAt(0, 0),
            newSize(10, 10),
            'requestable region'
        )
    );
    const transferPoint = newTransferPoint(
        newSimulatedRegionPositionIn(otherSimulatedRegion.id),
        '',
        `[Simuliert] requestable region`
    );
    draftState.transferPoints[transferPoint.id] =
        cloneDeepMutable(transferPoint);
    draftState.simulatedRegions[otherSimulatedRegion.id] =
        cloneDeepMutable(otherSimulatedRegion);
    updateBehaviorsRequestTarget(
        draftState,
        simulatedRegion,
        behaviorState,
        SimulatedRegionRequestTargetConfiguration.create(
            otherSimulatedRegion.id
        )
    );
}

function updateInvalidationInterval(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    behaviorState: WritableDraft<RequestBehaviorState>
) {
    behaviorState.invalidatePromiseInterval = newInvalidationInterval;
    // update its promised resources
    getResourcesToRequest(draftState, behaviorState);
}

// factories
const addRequestsAndPromises = {
    withoutRequestsAndPromises: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    ) => {},
    withRequests: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.requestedResources[requestKey] = cloneDeepMutable(
            VehicleResource.create({
                KTW: 1,
            })
        );
    },
    withPromises: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.promisedResources = cloneDeepMutable([
            ResourcePromise.create(
                draftState.currentTime,
                VehicleResource.create({ KTW: 1 })
            ),
        ]);
    },
    withOldPromises: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.promisedResources = cloneDeepMutable([
            ResourcePromise.create(oldTime, VehicleResource.create({ KTW: 1 })),
        ]);
    },
    withOldAndNewPromises: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.promisedResources = cloneDeepMutable([
            ResourcePromise.create(oldTime, VehicleResource.create({ KTW: 1 })),
            ResourcePromise.create(
                draftState.currentTime,
                VehicleResource.create({ KTW: 1 })
            ),
        ]);
    },
    withRequestsAndEnoughPromises: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.requestedResources[requestKey] = cloneDeepMutable(
            VehicleResource.create({
                KTW: 1,
            })
        );
        behaviorState.promisedResources = cloneDeepMutable([
            ResourcePromise.create(
                draftState.currentTime,
                VehicleResource.create({ KTW: 1 })
            ),
        ]);
    },
    withRequestsAndNotEnoughPromises: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.requestedResources[requestKey] = cloneDeepMutable(
            VehicleResource.create({
                KTW: 2,
            })
        );
        behaviorState.promisedResources = cloneDeepMutable([
            ResourcePromise.create(
                draftState.currentTime,
                VehicleResource.create({ KTW: 1 })
            ),
        ]);
    },
    withPromiseOfOtherType: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.promisedResources = cloneDeepMutable([
            ResourcePromise.create(
                draftState.currentTime,
                VehicleResource.create({ RTW: 1 })
            ),
        ]);
    },
    withPromisesOfMultipleTypes: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.promisedResources = cloneDeepMutable([
            ResourcePromise.create(
                draftState.currentTime,
                VehicleResource.create({ KTW: 1 })
            ),
            ResourcePromise.create(
                draftState.currentTime,
                VehicleResource.create({ RTW: 1 })
            ),
        ]);
    },
};

const sendEvent = {
    resourceRequiredEvent: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        sendSimulationEvent(
            simulatedRegion,
            ResourceRequiredEvent.create(
                simulatedRegion.id,
                VehicleResource.create({ KTW: 1 }),
                'new-request-key'
            )
        );
    },
    resourceRequiredEventWithKnownKey: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        sendSimulationEvent(
            simulatedRegion,
            ResourceRequiredEvent.create(
                simulatedRegion.id,
                VehicleResource.create({ KTW: 1 }),
                requestKey
            )
        );
    },
    vehiclesSendEvent: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        const transferPoint = Object.values(draftState.transferPoints)[0]!;
        sendSimulationEvent(
            simulatedRegion,
            VehiclesSentEvent.create(
                VehicleResource.create({ KTW: 1 }),
                transferPoint.id
            )
        );
    },
    ktwVehicleArrivedEvent: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        const vehicle = newVehicle(
            'KTW',
            'KTW 1',
            uuid(),
            {},
            0,
            newImageProperties('', 0, 0),
            newSimulatedRegionPositionIn(simulatedRegion.id),
            newNoOccupation()
        );
        draftState.vehicles[vehicle.id] = cloneDeepMutable(vehicle);

        sendSimulationEvent(
            simulatedRegion,
            VehicleArrivedEvent.create(vehicle.id, draftState.currentTime)
        );
    },
    sendRequestEvent: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        sendSimulationEvent(simulatedRegion, SendRequestEvent.create());
    },
};

// tests
describe('request behavior', () => {
    describe('on a resource required event', () => {
        describe.each(StrictObject.keys(addRequestsAndPromises))(
            '%s',
            (requestsAndPromises) => {
                it('should note the request', () => {
                    const { afterBehaviorState } = setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        sendEvent.resourceRequiredEvent
                    );

                    expect(
                        afterBehaviorState.requestedResources['new-request-key']
                    ).toEqual(VehicleResource.create({ KTW: 1 }));
                });
            }
        );
    });

    describe('on a resource required event with a known key', () => {
        describe.each(StrictObject.keys(addRequestsAndPromises))(
            '%s',
            (requestsAndPromises) => {
                it('should overwrite any existing requests', () => {
                    const { afterBehaviorState } = setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        sendEvent.resourceRequiredEventWithKnownKey
                    );

                    expect(
                        Object.keys(afterBehaviorState.requestedResources)
                            .length
                    ).toBe(1);
                });
            }
        );
    });

    describe('on a vehicle send event', () => {
        describe.each(StrictObject.keys(addRequestsAndPromises))(
            '%s',
            (requestsAndPromises) => {
                it('should note the promise', () => {
                    const { afterBehaviorState } = setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        sendEvent.vehiclesSendEvent
                    );

                    const promisedResources =
                        afterBehaviorState.promisedResources;
                    expect(promisedResources.length).toBeGreaterThanOrEqual(1);
                    const promise = promisedResources.at(-1)!;
                    expect(promise.resource).toEqual(
                        VehicleResource.create({ KTW: 1 })
                    );
                });
            }
        );
    });

    describe('on a ktw vehicle arrived event', () => {
        describe.each(withoutKTWPromise)('%s', (requestsAndPromises) => {
            it('should not change its noted promises', () => {
                const { beforeBehaviorState, afterBehaviorState } =
                    setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        sendEvent.ktwVehicleArrivedEvent
                    );

                expect(afterBehaviorState.promisedResources).toEqual(
                    beforeBehaviorState.promisedResources
                );
            });
        });

        describe.each(withOneKTWPromised)('%s', (requestsAndPromises) => {
            it('should remove the promise', () => {
                const { afterBehaviorState } = setupStateAndInteract(
                    addRequestsAndPromises[requestsAndPromises],
                    sendEvent.ktwVehicleArrivedEvent
                );

                expect(
                    afterBehaviorState.promisedResources.find(
                        (promise) => 'KTW' in promise.resource.vehicleCounts
                    )
                ).toBeUndefined();
            });
        });
    });

    describe('on a send request event', () => {
        describe.each(withOneKTWRequired)('%s', (requestsAndPromises) => {
            it('should create a request via an activity', () => {
                const { afterSimulatedRegion, afterBehaviorState } =
                    setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        sendEvent.sendRequestEvent
                    );

                const activities = afterSimulatedRegion.activities;
                expect(
                    StrictObject.keys(activities).length
                ).toBeGreaterThanOrEqual(1);

                const activity = StrictObject.values(activities).find(
                    (a) => a.type === 'createRequestActivity'
                );
                expect(activity).toBeDefined();

                const typedActivity = activity!;
                expect(typedActivity.targetConfiguration).toEqual(
                    afterBehaviorState.requestTarget
                );
                expect(typedActivity.requestedResource).toEqual(
                    VehicleResource.create({ KTW: 1 })
                );
            });
        });
    });

    describe('when the request interval is updated', () => {
        describe.each(StrictObject.keys(addRequestsAndPromises))(
            '%s',
            (requestsAndPromises) => {
                it('should update the request interval', () => {
                    const { afterBehaviorState } = setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        updateRequestInterval
                    );

                    expect(afterBehaviorState.requestInterval).toBe(
                        newRequestInterval
                    );
                });

                it('should update the timer', () => {
                    const { afterSimulatedRegion } = setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        updateRequestInterval
                    );

                    const afterRecurringEventActivity = StrictObject.values(
                        afterSimulatedRegion.activities
                    ).find((a) => a.type === 'recurringEventActivity')!;

                    expect(
                        afterRecurringEventActivity.recurrenceIntervalTime
                    ).toBe(newRequestInterval);
                });
            }
        );
    });

    describe('when the request target is updated', () => {
        describe.each(StrictObject.keys(addRequestsAndPromises))(
            '%s',
            (requestsAndPromises) => {
                it('should update the request target', () => {
                    const { afterBehaviorState } = setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        updateRequestTarget
                    );

                    expect(afterBehaviorState.requestTarget.type).toEqual(
                        'simulatedRegionRequestTarget'
                    );
                });
            }
        );
    });

    describe('when the invalidation interval for promises is updated', () => {
        describe.each(withoutOldTime)('%s', (requestsAndPromises) => {
            it('should not invalidate any promises', () => {
                const { beforeBehaviorState, afterBehaviorState } =
                    setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        updateInvalidationInterval
                    );

                expect(afterBehaviorState.promisedResources).toEqual(
                    beforeBehaviorState.promisedResources
                );
            });
        });

        describe.each(withOldTime)('%s', (requestsAndPromises) => {
            it('should invalidate old promises', () => {
                const { afterState, afterBehaviorState } =
                    setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        updateInvalidationInterval
                    );

                expect(
                    Object.keys(
                        afterBehaviorState.promisedResources.filter(
                            (promise) =>
                                promise.promisedTime + newInvalidationInterval <
                                afterState.currentTime
                        )
                    ).length
                ).toBe(0);
            });

            it('should keep current promises', () => {
                const { beforeBehaviorState, afterBehaviorState } =
                    setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        updateInvalidationInterval
                    );

                beforeBehaviorState.promisedResources.forEach(
                    (beforePromise) => {
                        if (
                            beforePromise.promisedTime +
                                newInvalidationInterval >=
                            currentTime
                        ) {
                            expect(
                                afterBehaviorState.promisedResources
                            ).toContainEqual(beforePromise);
                        }
                    }
                );
            });
        });
    });
});
