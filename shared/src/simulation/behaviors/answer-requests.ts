import { z } from 'zod';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import {
    newTransferVehiclesRequestEvent,
    transferVehiclesRequestEventSchema,
} from '../events/transfer-vehicles-request.js';
import { getElementByPredicate } from '../../store/action-reducers/utils/get-element.js';
import { isInSpecificSimulatedRegion } from '../../models/utils/position/position-helpers.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { addActivity } from '../activities/utils.js';
import { newDelayEventActivityState } from '../activities/delay-event.js';
import { nextUUID } from '../utils/randomness.js';
import { newResourceRequiredEvent } from '../events/resources-required.js';
import { newVehicleResource } from '../../models/utils/rescue-resource.js';
import { uuid } from '../../utils/uuid.js';
import {
    type SimulationBehavior,
    simulationBehaviorStateSchema,
} from './simulation-behavior.js';

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
