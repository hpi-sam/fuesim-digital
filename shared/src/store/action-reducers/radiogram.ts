import { z } from 'zod';
import type { Immutable } from 'immer';
import {
    acceptRadiogram,
    markRadiogramDone,
    returnRadiogram,
} from '../../models/radiogram/radiogram-helpers-mutable.js';
import { newVehicleResource } from '../../models/utils/rescue-resource.js';
import { sendSimulationEvent } from '../../simulation/events/utils.js';
import type { ActionReducer } from '../action-reducer.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { newVehiclesSentEvent } from '../../simulation/events/vehicles-sent.js';
import { isInSpecificSimulatedRegion } from '../../models/utils/position/position-helpers.js';
import { createRadiogramActionTag } from '../../models/utils/tag-helpers.js';
import type { ResourceRequestRadiogram } from '../../models/radiogram/resource-request-radiogram.js';
import { clientSchema } from '../../models/client.js';
import { radiogramSchema } from '../../models/radiogram/radiogram.js';
import {
    getElement,
    getElementByPredicate,
    getExerciseRadiogramById,
    getRadiogramById,
} from './utils/get-element.js';
import { logRadiogram } from './utils/log.js';

const acceptRadiogramActionSchema = z.strictObject({
    type: z.literal('[Radiogram] Accept radiogram'),
    radiogramId: radiogramSchema.shape.id,
    clientId: clientSchema.shape.id,
});
export type AcceptRadiogramAction = Immutable<
    z.infer<typeof acceptRadiogramActionSchema>
>;

const returnRadiogramActionSchema = z.strictObject({
    type: z.literal('[Radiogram] Return radiogram'),
    radiogramId: radiogramSchema.shape.id,
});
export type ReturnRadiogramAction = Immutable<
    z.infer<typeof returnRadiogramActionSchema>
>;

const markDoneRadiogramActionSchema = z.strictObject({
    type: z.literal('[Radiogram] Mark as done'),
    radiogramId: radiogramSchema.shape.id,
    // Migration would be borderline impossible so we save it now, even if we do not need it yet
    clientId: clientSchema.shape.id,
});
export type MarkDoneRadiogramAction = Immutable<
    z.infer<typeof markDoneRadiogramActionSchema>
>;

const acceptResourceRequestRadiogramActionSchema = z.strictObject({
    type: z.literal('[Radiogram] Accept resource request'),
    radiogramId: radiogramSchema.shape.id,
});
export type AcceptResourceRequestRadiogramAction = Immutable<
    z.infer<typeof acceptResourceRequestRadiogramActionSchema>
>;

const denyResourceRequestRadiogramActionSchema = z.strictObject({
    type: z.literal('[Radiogram] Deny resource request'),
    radiogramId: radiogramSchema.shape.id,
});
export type DenyResourceRequestRadiogramAction = Immutable<
    z.infer<typeof denyResourceRequestRadiogramActionSchema>
>;

export namespace RadiogramActionReducers {
    export const acceptRadiogramReducer: ActionReducer<AcceptRadiogramAction> =
        {
            type: acceptRadiogramActionSchema.shape.type.value,
            actionSchema: acceptRadiogramActionSchema,
            reducer: (draftState, { radiogramId, clientId }) => {
                acceptRadiogram(draftState, radiogramId, clientId);
                return draftState;
            },
            rights: 'trainer',
        };

    export const returnRadiogramReducer: ActionReducer<ReturnRadiogramAction> =
        {
            type: returnRadiogramActionSchema.shape.type.value,
            actionSchema: returnRadiogramActionSchema,
            reducer: (draftState, { radiogramId }) => {
                returnRadiogram(draftState, radiogramId);
                return draftState;
            },
            rights: 'trainer',
        };

    export const markDoneReducer: ActionReducer<MarkDoneRadiogramAction> = {
        type: markDoneRadiogramActionSchema.shape.type.value,
        actionSchema: markDoneRadiogramActionSchema,
        reducer: (draftState, { radiogramId }) => {
            const radiogram = getExerciseRadiogramById(draftState, radiogramId);
            if (radiogram.type === 'resourceRequestRadiogram') {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    radiogram.simulatedRegionId
                );
                const transferPoint = getElementByPredicate(
                    draftState,
                    'transferPoint',
                    (tp) =>
                        isInSpecificSimulatedRegion(
                            tp,
                            radiogram.simulatedRegionId
                        )
                );
                sendSimulationEvent(
                    simulatedRegion,
                    cloneDeepMutable(
                        newVehiclesSentEvent(
                            newVehicleResource({}),
                            transferPoint.id
                        )
                    )
                );
                radiogram.resourcesPromised = false;
                logRadiogram(
                    draftState,
                    [createRadiogramActionTag(draftState, 'resourcesRejected')],
                    'Die Ressourcen der Anfrage wurden verweigert.',
                    radiogramId
                );
            }

            markRadiogramDone(draftState, radiogramId);

            return draftState;
        },
        rights: 'trainer',
    };

    export const acceptResourceRequestRadiogramReducer: ActionReducer<AcceptResourceRequestRadiogramAction> =
        {
            type: acceptResourceRequestRadiogramActionSchema.shape.type.value,
            actionSchema: acceptResourceRequestRadiogramActionSchema,
            reducer: (draftState, { radiogramId }) => {
                const radiogram = getRadiogramById<ResourceRequestRadiogram>(
                    draftState,
                    radiogramId,
                    'resourceRequestRadiogram'
                );
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    radiogram.simulatedRegionId
                );
                const transferPoint = getElementByPredicate(
                    draftState,
                    'transferPoint',
                    (tp) =>
                        isInSpecificSimulatedRegion(
                            tp,
                            radiogram.simulatedRegionId
                        )
                );

                sendSimulationEvent(
                    simulatedRegion,
                    cloneDeepMutable(
                        newVehiclesSentEvent(
                            radiogram.requiredResource,
                            transferPoint.id
                        )
                    )
                );

                radiogram.resourcesPromised = true;
                logRadiogram(
                    draftState,
                    [createRadiogramActionTag(draftState, 'resourcesPromised')],
                    'Die Ressourcen der Anfrage wurden versprochen.',
                    radiogramId
                );

                markRadiogramDone(draftState, radiogramId);

                return draftState;
            },
            rights: 'trainer',
        };

    export const denyResourceRequestRadiogramReducer: ActionReducer<DenyResourceRequestRadiogramAction> =
        {
            type: denyResourceRequestRadiogramActionSchema.shape.type.value,
            actionSchema: denyResourceRequestRadiogramActionSchema,
            reducer: (draftState, { radiogramId }) => {
                const radiogram = getRadiogramById<ResourceRequestRadiogram>(
                    draftState,
                    radiogramId,
                    'resourceRequestRadiogram'
                );
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    radiogram.simulatedRegionId
                );
                const transferPoint = getElementByPredicate(
                    draftState,
                    'transferPoint',
                    (tp) =>
                        isInSpecificSimulatedRegion(
                            tp,
                            radiogram.simulatedRegionId
                        )
                );

                sendSimulationEvent(
                    simulatedRegion,
                    cloneDeepMutable(
                        newVehiclesSentEvent(
                            newVehicleResource({}),
                            transferPoint.id
                        )
                    )
                );

                radiogram.resourcesPromised = false;
                logRadiogram(
                    draftState,
                    [createRadiogramActionTag(draftState, 'resourcesRejected')],
                    'Die Ressourcen der Anfrage wurden verweigert.',
                    radiogramId
                );

                markRadiogramDone(draftState, radiogramId);

                return draftState;
            },
            rights: 'trainer',
        };
}
