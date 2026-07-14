import type { WritableDraft, Immutable } from 'immer';
import { z } from 'zod';
import {
    changePosition,
    offsetMapPositionBy,
} from '../../models/utils/position/position-helpers-mutable.js';
import type { ExerciseState } from '../../state.js';
import type { ActionReducer } from '../action-reducer.js';
import { ExpectedReducerError, ReducerError } from '../reducer-error.js';
import { sendSimulationEvent } from '../../simulation/events/utils.js';
import type { Vehicle } from '../../models/vehicle.js';
import {
    transferPointImage,
    transferPointSchema,
} from '../../models/transfer-point.js';
import { newVehicleArrivedEvent } from '../../simulation/events/vehicle-arrived.js';
import {
    createTransferPointTag,
    createVehicleActionTag,
} from '../../models/utils/tag-helpers.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { startPointSchema } from '../../models/utils/start-points.js';
import {
    currentTransferOf,
    isInTransfer,
    isPositionInSimulatedRegion,
    isPositionOnMap,
    simulatedRegionIdOfPosition,
} from '../../models/utils/position/position-helpers.js';
import { newTransferPositionFor } from '../../models/utils/position/transfer-position.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import type { MapPosition } from '../../models/utils/position/map-position.js';
import { imageSizeToPosition } from '../../state-helpers/image-size-to-position.js';
import { newPersonnelAvailableEvent } from '../../simulation/events/personnel-available.js';
import {
    logElementAddedToTransfer,
    logTransferEdited,
    logTransferFinished,
    logTransferPause,
    logVehicle,
} from './utils/log.js';
import { getElement } from './utils/get-element.js';
import { isVehicleLoading } from './vehicle.js';

const transferableElementTypeSchema = z.enum(['personnel', 'vehicle']);
export type TransferableElementType = z.infer<
    typeof transferableElementTypeSchema
>;

/**
 * Personnel/Vehicle in transfer will arrive immediately at new targetTransferPoint
 * Transfer gets deleted afterwards
 * @param elementId of an element that is in transfer
 */
export function letElementArrive(
    draftState: WritableDraft<ExerciseState>,
    elementType: TransferableElementType,
    elementId: UUID
) {
    const element = getElement(draftState, elementType, elementId);
    // check that element is in transfer, this should be always the case where this function is used
    if (!isInTransfer(element)) {
        throw getNotInTransferError(element.id);
    }
    const targetTransferPoint = getElement(
        draftState,
        'transferPoint',
        currentTransferOf(element).targetTransferPointId
    );
    const newPosition = cloneDeepMutable(targetTransferPoint.position);
    if (isPositionOnMap(newPosition)) {
        offsetMapPositionBy(newPosition as WritableDraft<MapPosition>, {
            x: 0,
            y: imageSizeToPosition(transferPointImage.height / 3),
        });
    }
    if (isPositionInSimulatedRegion(newPosition)) {
        const simulatedRegion = getElement(
            draftState,
            'simulatedRegion',
            simulatedRegionIdOfPosition(newPosition)
        );
        if (elementType === 'personnel') {
            sendSimulationEvent(
                simulatedRegion,
                newPersonnelAvailableEvent(elementId)
            );
        }
        if (elementType === 'vehicle') {
            sendSimulationEvent(
                simulatedRegion,
                newVehicleArrivedEvent(elementId, draftState.currentTime)
            );
        }
    }
    changePosition(element, newPosition, draftState);
    if (elementType === 'vehicle') {
        logVehicle(
            draftState,
            [
                createVehicleActionTag(draftState, 'arrived'),
                createTransferPointTag(draftState, targetTransferPoint.id),
            ],
            `${(element as WritableDraft<Vehicle>).name} ist an ${
                targetTransferPoint.externalName
            } angekommen`,
            elementId
        );
    }
}

const addToTransferActionSchema = z.strictObject({
    type: z.literal('[Transfer] Add to transfer'),
    elementType: transferableElementTypeSchema,
    elementId: uuidSchema,
    startPoint: startPointSchema,
    targetTransferPointId: transferPointSchema.shape.id,
});
export type AddToTransferAction = Immutable<
    z.infer<typeof addToTransferActionSchema>
>;

const editTransferActionSchema = z.strictObject({
    type: z.literal('[Transfer] Edit transfer'),
    elementType: transferableElementTypeSchema,
    elementId: uuidSchema,
    targetTransferPointId: transferPointSchema.shape.id.optional(),
    /**
     * How much time in ms should be added to the transfer time.
     * If it is negative, the transfer time will be decreased.
     * If the time is set to a time in the past it will be set to the current time.
     */
    timeToAdd: z.number().optional(),
});
export type EditTransferAction = Immutable<
    z.infer<typeof editTransferActionSchema>
>;

const finishTransferActionSchema = z.strictObject({
    type: z.literal('[Transfer] Finish transfer'),
    elementType: transferableElementTypeSchema,
    elementId: uuidSchema,
    targetTransferPointId: transferPointSchema.shape.id,
});
export type FinishTransferAction = Immutable<
    z.infer<typeof finishTransferActionSchema>
>;

const togglePauseTransferActionSchema = z.strictObject({
    type: z.literal('[Transfer] Toggle pause transfer'),
    elementType: transferableElementTypeSchema,
    elementId: uuidSchema,
});
export type TogglePauseTransferAction = Immutable<
    z.infer<typeof togglePauseTransferActionSchema>
>;

export namespace TransferActionReducers {
    export const addToTransfer: ActionReducer<AddToTransferAction> = {
        type: addToTransferActionSchema.shape.type.value,
        actionSchema: addToTransferActionSchema,
        reducer: (
            draftState,
            { elementType, elementId, startPoint, targetTransferPointId }
        ) => {
            // check if transferPoint exists
            getElement(draftState, 'transferPoint', targetTransferPointId);
            const element = getElement(draftState, elementType, elementId);

            if (isInTransfer(element)) {
                throw new ReducerError(
                    `Element with id ${element.id} is already in transfer`
                );
            }

            if (
                elementType === 'vehicle' &&
                isVehicleLoading(
                    element as Vehicle,
                    draftState.currentTime,
                    draftState.configuration
                )
            )
                throw new ExpectedReducerError(
                    'Das Fahrzeug wird gerade beladen und kann daher nicht bewegt werden'
                );

            // Get the duration
            let duration: number;
            if (startPoint.type === 'transferStartPoint') {
                const transferStartPoint = getElement(
                    draftState,
                    'transferPoint',
                    startPoint.transferPointId
                );
                const connection =
                    transferStartPoint.reachableTransferPoints[
                        targetTransferPointId
                    ];
                if (!connection) {
                    throw new ReducerError(
                        `TransferPoint with id ${targetTransferPointId} is not reachable from ${transferStartPoint.id}`
                    );
                }
                duration = connection.duration;
            } else {
                duration = startPoint.duration;
            }

            // Set the element to transfer
            changePosition(
                element,
                newTransferPositionFor({
                    startPoint: cloneDeepMutable(startPoint),
                    targetTransferPointId,
                    endTimeStamp: draftState.currentTime + duration,
                    isPaused: false,
                }),
                draftState
            );
            logElementAddedToTransfer(
                draftState,
                startPoint.type === 'alarmGroupStartPoint'
                    ? startPoint.alarmGroupId
                    : startPoint.transferPointId,
                startPoint.type === 'alarmGroupStartPoint'
                    ? 'alarmGroup'
                    : 'transferPoint',
                elementId,
                elementType,
                currentTransferOf(element).targetTransferPointId,
                'transferPoint',
                duration
            );

            return draftState;
        },
        rights: 'participant',
    };

    export const editTransfer: ActionReducer<EditTransferAction> = {
        type: editTransferActionSchema.shape.type.value,
        actionSchema: editTransferActionSchema,
        reducer: (
            draftState,
            { elementType, elementId, targetTransferPointId, timeToAdd }
        ) => {
            const element = getElement(draftState, elementType, elementId);
            if (!isInTransfer(element)) {
                throw getNotInTransferError(element.id);
            }
            const newTransfer = cloneDeepMutable(currentTransferOf(element));
            if (targetTransferPointId) {
                // check if transferPoint exists

                getElement(draftState, 'transferPoint', targetTransferPointId);
                newTransfer.targetTransferPointId = targetTransferPointId;
            }
            if (timeToAdd) {
                //  The endTimeStamp shouldn't be less then the current time
                newTransfer.endTimeStamp = Math.max(
                    draftState.currentTime,
                    newTransfer.endTimeStamp + timeToAdd
                );
            }
            logTransferEdited(
                draftState,
                elementId,
                elementType,
                currentTransferOf(element).targetTransferPointId,
                newTransfer.targetTransferPointId,
                currentTransferOf(element).endTimeStamp -
                    draftState.currentTime,
                newTransfer.endTimeStamp - draftState.currentTime
            );
            changePosition(
                element,
                newTransferPositionFor(newTransfer),
                draftState
            );
            return draftState;
        },
        rights: 'trainer',
    };

    export const finishTransfer: ActionReducer<FinishTransferAction> = {
        type: finishTransferActionSchema.shape.type.value,
        actionSchema: finishTransferActionSchema,
        reducer: (
            draftState,
            { elementType, elementId, targetTransferPointId }
        ) => {
            // check if transferPoint exists
            getElement(draftState, 'transferPoint', targetTransferPointId);
            const element = getElement(draftState, elementType, elementId);
            if (!isInTransfer(element)) {
                throw getNotInTransferError(element.id);
            }
            logTransferFinished(
                draftState,
                elementId,
                elementType,
                currentTransferOf(element).targetTransferPointId
            );
            letElementArrive(draftState, elementType, elementId);
            return draftState;
        },
        rights: 'trainer',
    };

    export const togglePauseTransfer: ActionReducer<TogglePauseTransferAction> =
        {
            type: togglePauseTransferActionSchema.shape.type.value,
            actionSchema: togglePauseTransferActionSchema,
            reducer: (draftState, { elementType, elementId }) => {
                const element = getElement(draftState, elementType, elementId);
                if (!isInTransfer(element)) {
                    throw getNotInTransferError(element.id);
                }
                const newTransfer = cloneDeepMutable(
                    currentTransferOf(element)
                );
                newTransfer.isPaused = !newTransfer.isPaused;
                logTransferPause(
                    draftState,
                    elementId,
                    elementType,
                    newTransfer.targetTransferPointId,
                    newTransfer.isPaused
                );
                changePosition(
                    element,
                    newTransferPositionFor(newTransfer),
                    draftState
                );
                return draftState;
            },
            rights: 'trainer',
        };
}

function getNotInTransferError(elementId: UUID) {
    return new ReducerError(`Element with id ${elementId} is not in transfer`);
}
