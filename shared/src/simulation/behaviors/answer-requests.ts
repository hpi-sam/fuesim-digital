import { z } from 'zod';
import {
    isInSpecificSimulatedRegion,
    newVehicleResource,
} from '../../models/index.js';
import { getElementByPredicate } from '../../store/action-reducers/utils/index.js';
import { cloneDeepMutable, uuid } from '../../utils/index.js';
import { addActivity } from '../activities/utils.js';
import { nextUUID } from '../utils/randomness.js';
import { newDelayEventActivityState } from '../activities/index.js';
import {
    transferVehiclesRequestEventSchema,
    newTransferVehiclesRequestEvent,
    newResourceRequiredEvent,
} from '../events/index.js';
import type { ResourceDescription } from '../../models/index.js';
import type { SimulationBehavior } from './simulation-behavior.js';
import { simulationBehaviorStateSchema } from './simulation-behavior.js';

export const answerRequestsBehaviorStateSchema = z.strictObject({
    ...simulationBehaviorStateSchema.shape,
    type: z.literal('answerRequestsBehavior'),
    receivedEvents: z.array(transferVehiclesRequestEventSchema),
    requestsHandled: z.int().nonnegative(),
});

export type AnswerRequestsBehaviorState = z.infer<
    typeof answerRequestsBehaviorStateSchema
>;

export function newAnswerRequestsBehaviorState(): AnswerRequestsBehaviorState {
    return {
        type: 'answerRequestsBehavior',
        id: uuid(),
        receivedEvents: [],
        requestsHandled: 0,
    };
}

export const answerRequestsBehavior: SimulationBehavior<AnswerRequestsBehaviorState> =
    {
        behaviorStateSchema: answerRequestsBehaviorStateSchema,
        newBehaviorState: newAnswerRequestsBehaviorState,
        handleEvent: (draftState, simulatedRegion, behaviorState, event) => {
            switch (event.type) {
                case 'resourceRequiredEvent': {
                    if (
                        event.requiringSimulatedRegionId !== simulatedRegion.id
                    ) {
                        if (event.requiredResource.type === 'vehicleResource') {
                            const requiringSimulatedRegionTransferPoint =
                                getElementByPredicate(
                                    draftState,
                                    'transferPoint',
                                    (transferPoint) =>
                                        isInSpecificSimulatedRegion(
                                            transferPoint,
                                            event.requiringSimulatedRegionId
                                        )
                                );
                            const eventToSend = newTransferVehiclesRequestEvent(
                                event.requiredResource.vehicleCounts,
                                'transferPoint',
                                requiringSimulatedRegionTransferPoint.id,
                                event.requiringSimulatedRegionId,
                                requiringSimulatedRegionTransferPoint.id +
                                    behaviorState.requestsHandled
                            );
                            behaviorState.receivedEvents.push(
                                cloneDeepMutable(eventToSend)
                            );
                            addActivity(
                                simulatedRegion,
                                newDelayEventActivityState(
                                    nextUUID(draftState),
                                    eventToSend,
                                    draftState.currentTime
                                )
                            );
                        }
                    }
                    break;
                }
                case 'requestReceivedEvent':
                    {
                        const requestEventIndex =
                            behaviorState.receivedEvents.findIndex(
                                (receivedEvent) =>
                                    receivedEvent.key === event.key
                            );
                        const requestEvent =
                            behaviorState.receivedEvents[requestEventIndex];
                        let createEvent = false;
                        const vehiclesNotAvailable: ResourceDescription = {};
                        if (requestEvent) {
                            Object.entries(
                                requestEvent.requestedVehicles
                            ).forEach(
                                ([vehicleType, requestedVehicleAmount]) => {
                                    if (
                                        (event.availableVehicles[vehicleType] ??
                                            0) < requestedVehicleAmount
                                    ) {
                                        vehiclesNotAvailable[vehicleType] =
                                            requestedVehicleAmount -
                                            (event.availableVehicles[
                                                vehicleType
                                            ] ?? 0);
                                        createEvent = true;
                                    }
                                }
                            );
                            behaviorState.receivedEvents.splice(
                                requestEventIndex,
                                1
                            );
                        }

                        // createEvent might be set to `true` in the `forEach` arrow function
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (createEvent) {
                            addActivity(
                                simulatedRegion,
                                newDelayEventActivityState(
                                    nextUUID(draftState),
                                    newResourceRequiredEvent(
                                        simulatedRegion.id,
                                        newVehicleResource(
                                            vehiclesNotAvailable
                                        ),
                                        requestEvent!.key ?? ''
                                    ),
                                    draftState.currentTime
                                )
                            );
                        }
                    }
                    break;
                default:
                // Ignore event
            }
        },
    };
