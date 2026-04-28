import { produce, type WritableDraft } from 'immer';
import { ExerciseState } from '../../state.js';
import { sendSimulationEvent } from '../events/utils.js';
import { handleSimulationEvents } from '../utils/simulation.js';
import { addActivity } from '../activities/utils.js';
import { newSendRequestEvent } from '../events/send-request.js';
import { newResourcePromise } from '../utils/resource-promise.js';
import { newVehicle } from '../../models/vehicle.js';
import type { ParticipantKey } from '../../exercise-keys.js';
import { newRecurringEventActivityState } from '../activities/recurring-event.js';
import { newImageProperties } from '../../models/utils/image-properties.js';
import { newSimulatedRegionPositionIn } from '../../models/utils/position/simulated-region-position.js';
import { newNoOccupation } from '../../models/utils/occupations/no-occupation.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { newVehicleArrivedEvent } from '../events/vehicle-arrived.js';
import {
    newSimulatedRegion,
    type SimulatedRegion,
} from '../../models/simulated-region.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';
import { newVehicleResource } from '../../models/utils/rescue-resource.js';
import { newMapCoordinatesAt } from '../../models/utils/position/map-coordinates.js';
import { newSize } from '../../models/utils/size.js';
import { newTransferPoint } from '../../models/transfer-point.js';
import { uuid } from '../../utils/uuid.js';
import { newSimulatedRegionRequestTargetConfiguration } from '../../models/utils/request-target/simulated-region.js';
import { newResourceRequiredEvent } from '../events/resources-required.js';
import { newVehiclesSentEvent } from '../events/vehicles-sent.js';
import type { RequestBehaviorState } from './request.js';
import {
    getResourcesToRequest,
    updateBehaviorsRequestInterval,
    updateBehaviorsRequestTarget,
    newRequestBehaviorState,
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
    const simulatedRegion = newSimulatedRegion(
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
            cloneDeepMutable(newRequestBehaviorState())
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
            newRecurringEventActivityState(
                behaviorState.recurringEventActivityId,
                newSendRequestEvent(),
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
        newSimulatedRegion(
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
        newSimulatedRegionRequestTargetConfiguration(otherSimulatedRegion.id)
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
            newVehicleResource({
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
            newResourcePromise(
                draftState.currentTime,
                newVehicleResource({ KTW: 1 })
            ),
        ]);
    },
    withOldPromises: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.promisedResources = cloneDeepMutable([
            newResourcePromise(oldTime, newVehicleResource({ KTW: 1 })),
        ]);
    },
    withOldAndNewPromises: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.promisedResources = cloneDeepMutable([
            newResourcePromise(oldTime, newVehicleResource({ KTW: 1 })),
            newResourcePromise(
                draftState.currentTime,
                newVehicleResource({ KTW: 1 })
            ),
        ]);
    },
    withRequestsAndEnoughPromises: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.requestedResources[requestKey] = cloneDeepMutable(
            newVehicleResource({
                KTW: 1,
            })
        );
        behaviorState.promisedResources = cloneDeepMutable([
            newResourcePromise(
                draftState.currentTime,
                newVehicleResource({ KTW: 1 })
            ),
        ]);
    },
    withRequestsAndNotEnoughPromises: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.requestedResources[requestKey] = cloneDeepMutable(
            newVehicleResource({
                KTW: 2,
            })
        );
        behaviorState.promisedResources = cloneDeepMutable([
            newResourcePromise(
                draftState.currentTime,
                newVehicleResource({ KTW: 1 })
            ),
        ]);
    },
    withPromiseOfOtherType: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.promisedResources = cloneDeepMutable([
            newResourcePromise(
                draftState.currentTime,
                newVehicleResource({ RTW: 1 })
            ),
        ]);
    },
    withPromisesOfMultipleTypes: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        behaviorState.promisedResources = cloneDeepMutable([
            newResourcePromise(
                draftState.currentTime,
                newVehicleResource({ KTW: 1 })
            ),
            newResourcePromise(
                draftState.currentTime,
                newVehicleResource({ RTW: 1 })
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
            newResourceRequiredEvent(
                simulatedRegion.id,
                newVehicleResource({ KTW: 1 }),
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
            newResourceRequiredEvent(
                simulatedRegion.id,
                newVehicleResource({ KTW: 1 }),
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
            newVehiclesSentEvent(
                newVehicleResource({ KTW: 1 }),
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
            newVehicleArrivedEvent(vehicle.id, draftState.currentTime)
        );
    },
    sendRequestEvent: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<RequestBehaviorState>
    ) => {
        sendSimulationEvent(simulatedRegion, newSendRequestEvent());
    },
};

// tests
describe('request behavior', () => {
    describe('on a resource required event', () => {
        describe.each(TypeAssertedObject.keys(addRequestsAndPromises))(
            '%s',
            (requestsAndPromises) => {
                it('should note the request', () => {
                    const { afterBehaviorState } = setupStateAndInteract(
                        addRequestsAndPromises[requestsAndPromises],
                        sendEvent.resourceRequiredEvent
                    );

                    expect(
                        afterBehaviorState.requestedResources['new-request-key']
                    ).toEqual(newVehicleResource({ KTW: 1 }));
                });
            }
        );
    });

    describe('on a resource required event with a known key', () => {
        describe.each(TypeAssertedObject.keys(addRequestsAndPromises))(
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
        describe.each(TypeAssertedObject.keys(addRequestsAndPromises))(
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
                        newVehicleResource({ KTW: 1 })
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
                    TypeAssertedObject.keys(activities).length
                ).toBeGreaterThanOrEqual(1);

                const activity = TypeAssertedObject.values(activities).find(
                    (a) => a.type === 'createRequestActivity'
                );
                expect(activity).toBeDefined();

                const typedActivity = activity!;
                expect(typedActivity.targetConfiguration).toEqual(
                    afterBehaviorState.requestTarget
                );
                expect(typedActivity.requestedResource).toEqual(
                    newVehicleResource({ KTW: 1 })
                );
            });
        });
    });

    describe('when the request interval is updated', () => {
        describe.each(TypeAssertedObject.keys(addRequestsAndPromises))(
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

                    const afterRecurringEventActivity =
                        TypeAssertedObject.values(
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
        describe.each(TypeAssertedObject.keys(addRequestsAndPromises))(
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
