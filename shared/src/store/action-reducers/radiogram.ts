import { IsUUID } from 'class-validator';
import type { ResourceRequestRadiogram } from '../../models/radiogram/index.js';
import {
    acceptRadiogram,
    markRadiogramDone,
    returnRadiogram,
} from '../../models/radiogram/radiogram-helpers-mutable.js';
import { VehicleResource } from '../../models/utils/rescue-resource.js';
import { VehiclesSentEvent } from '../../simulation/index.js';
import { sendSimulationEvent } from '../../simulation/events/utils.js';
import type { UUID } from '../../utils/index.js';
import { cloneDeepMutable, uuidValidationOptions } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import {
    createRadiogramActionTag,
    isInSpecificSimulatedRegion,
} from '../../models/index.js';
import {
    getElement,
    getElementByPredicate,
    getExerciseRadiogramById,
    getRadiogramById,
} from './utils/index.js';
import { logRadiogram } from './utils/log.js';

export class AcceptRadiogramAction implements Action {
    @IsValue('[Radiogram] Accept radiogram' as const)
    public readonly type = '[Radiogram] Accept radiogram';

    @IsUUID(4, uuidValidationOptions)
    public readonly radiogramId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly clientId!: UUID;
}

export class ReturnRadiogramAction implements Action {
    @IsValue('[Radiogram] Return radiogram' as const)
    public readonly type = '[Radiogram] Return radiogram';

    @IsUUID(4, uuidValidationOptions)
    public readonly radiogramId!: UUID;
}

export class MarkDoneRadiogramAction implements Action {
    @IsValue('[Radiogram] Mark as done' as const)
    public readonly type = '[Radiogram] Mark as done';

    @IsUUID(4, uuidValidationOptions)
    public readonly radiogramId!: UUID;

    // Migration would be borderline impossible so we save it now, even if we do not need it yet
    @IsUUID(4, uuidValidationOptions)
    public readonly clientId!: UUID;
}

export class AcceptResourceRequestRadiogramAction implements Action {
    @IsValue('[Radiogram] Accept resource request' as const)
    public readonly type = '[Radiogram] Accept resource request';

    @IsUUID(4, uuidValidationOptions)
    public readonly radiogramId!: UUID;
}

export class DenyResourceRequestRadiogramAction implements Action {
    @IsValue('[Radiogram] Deny resource request' as const)
    public readonly type = '[Radiogram] Deny resource request';

    @IsUUID(4, uuidValidationOptions)
    public readonly radiogramId!: UUID;
}

export namespace RadiogramActionReducers {
    export const acceptRadiogramReducer: ActionReducer<AcceptRadiogramAction> =
        {
            action: AcceptRadiogramAction,
            reducer: (draftState, { radiogramId, clientId }) => {
                acceptRadiogram(draftState, radiogramId, clientId);
                return draftState;
            },
            rights: 'participant',
        };

    export const returnRadiogramReducer: ActionReducer<ReturnRadiogramAction> =
        {
            action: ReturnRadiogramAction,
            reducer: (draftState, { radiogramId }) => {
                returnRadiogram(draftState, radiogramId);
                return draftState;
            },
            rights: 'participant',
        };

    export const markDoneReducer: ActionReducer<MarkDoneRadiogramAction> = {
        action: MarkDoneRadiogramAction,
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
                        VehiclesSentEvent.create(
                            VehicleResource.create({}),
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
        rights: 'participant',
    };

    export const acceptResourceRequestRadiogramReducer: ActionReducer<AcceptResourceRequestRadiogramAction> =
        {
            action: AcceptResourceRequestRadiogramAction,
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
                        VehiclesSentEvent.create(
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
            rights: 'participant',
        };

    export const denyResourceRequestRadiogramReducer: ActionReducer<DenyResourceRequestRadiogramAction> =
        {
            action: DenyResourceRequestRadiogramAction,
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
                        VehiclesSentEvent.create(
                            VehicleResource.create({}),
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
            rights: 'participant',
        };
}
