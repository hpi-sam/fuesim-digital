import { IsInt, IsOptional, IsUUID } from 'class-validator';
import { WritableDraft } from 'immer';
import {
    type StartPoint,
    type MapPosition,
    newTransferPositionFor,
    startPointSchema,
    isPositionOnMap,
    isInTransfer,
    currentTransferOf,
    isPositionInSimulatedRegion,
    simulatedRegionIdOfPosition,
    createVehicleActionTag,
    createTransferPointTag,
} from '../../models/index.js';
import {
    changePosition,
    offsetMapPositionBy,
} from '../../models/utils/position/position-helpers-mutable.js';
import type { ExerciseState } from '../../state.js';
import type { UUID } from '../../utils/index.js';
import { cloneDeepMutable, uuidValidationOptions } from '../../utils/index.js';
import type { AllowedValues } from '../../utils/validators/index.js';
import { IsLiteralUnion, IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { sendSimulationEvent } from '../../simulation/events/utils.js';
import {
    PersonnelAvailableEvent,
    VehicleArrivedEvent,
} from '../../simulation/index.js';
import { imageSizeToPosition } from '../../state-helpers/index.js';
import type { Vehicle } from '../../models/vehicle.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { transferPointImage } from '../../models/transfer-point.js';
import { getElement } from './utils/index.js';
import {
    logElementAddedToTransfer,
    logTransferEdited,
    logTransferFinished,
    logTransferPause,
    logVehicle,
} from './utils/log.js';

export type TransferableElementType = 'personnel' | 'vehicle';
const transferableElementTypeAllowedValues: AllowedValues<TransferableElementType> =
    { personnel: true, vehicle: true };

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
                PersonnelAvailableEvent.create(elementId)
            );
        }
        if (elementType === 'vehicle') {
            sendSimulationEvent(
                simulatedRegion,
                VehicleArrivedEvent.create(elementId, draftState.currentTime)
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

export class AddToTransferAction implements Action {
    @IsValue('[Transfer] Add to transfer' as const)
    public readonly type = '[Transfer] Add to transfer';

    @IsLiteralUnion(transferableElementTypeAllowedValues)
    elementType!: TransferableElementType;

    @IsUUID(4, uuidValidationOptions)
    public readonly elementId!: UUID;

    @IsZodSchema(startPointSchema)
    public readonly startPoint!: StartPoint;

    @IsUUID(4, uuidValidationOptions)
    public readonly targetTransferPointId!: UUID;
}

export class EditTransferAction implements Action {
    @IsValue('[Transfer] Edit transfer' as const)
    public readonly type = '[Transfer] Edit transfer';

    @IsLiteralUnion(transferableElementTypeAllowedValues)
    elementType!: TransferableElementType;

    @IsUUID(4, uuidValidationOptions)
    public readonly elementId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    @IsOptional()
    public readonly targetTransferPointId?: UUID;

    @IsInt()
    @IsOptional()
    /**
     * How much time in ms should be added to the transfer time.
     * If it is negative, the transfer time will be decreased.
     * If the time is set to a time in the past it will be set to the current time.
     */
    public readonly timeToAdd?: number;
}

export class FinishTransferAction implements Action {
    @IsValue('[Transfer] Finish transfer' as const)
    public readonly type = '[Transfer] Finish transfer';

    @IsLiteralUnion(transferableElementTypeAllowedValues)
    elementType!: TransferableElementType;

    @IsUUID(4, uuidValidationOptions)
    public readonly elementId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly targetTransferPointId!: UUID;
}

export class TogglePauseTransferAction implements Action {
    @IsValue('[Transfer] Toggle pause transfer' as const)
    public readonly type = '[Transfer] Toggle pause transfer';

    @IsLiteralUnion(transferableElementTypeAllowedValues)
    elementType!: TransferableElementType;

    @IsUUID(4, uuidValidationOptions)
    public readonly elementId!: UUID;
}

export namespace TransferActionReducers {
    export const addToTransfer: ActionReducer<AddToTransferAction> = {
        action: AddToTransferAction,
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
        action: EditTransferAction,
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
        action: FinishTransferAction,
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
            action: TogglePauseTransferAction,
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
