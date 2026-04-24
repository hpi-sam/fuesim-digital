import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {
    type TransferPoint,
    transferPointSchema,
} from '../../models/transfer-point.js';
import { type UUID, uuidValidationOptions } from '../../utils/uuid.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import {
    currentTransferOf,
    isInTransfer,
    nestedCoordinatesOf,
} from '../../models/utils/position/position-helpers.js';
import {
    type MapCoordinates,
    mapCoordinatesSchema,
} from '../../models/utils/position/map-coordinates.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { getElement } from './utils/get-element.js';
import {
    logTransferPointConnection,
    logTransferPointConnectionRemoved,
} from './utils/log.js';
import { letElementArrive } from './transfer.js';
import { calculateDistance } from './utils/calculate-distance.js';

// TODO check: type "TransferPoint" the T is big, in other files, the second word starts with a small letter

export class AddTransferPointAction implements Action {
    @IsValue('[TransferPoint] Add TransferPoint' as const)
    public readonly type = `[TransferPoint] Add TransferPoint`;

    @IsZodSchema(transferPointSchema)
    public readonly transferPoint!: TransferPoint;
}

export class MoveTransferPointAction implements Action {
    @IsValue('[TransferPoint] Move TransferPoint' as const)
    public readonly type = '[TransferPoint] Move TransferPoint';

    @IsUUID(4, uuidValidationOptions)
    public readonly transferPointId!: UUID;

    @IsZodSchema(mapCoordinatesSchema)
    public readonly targetPosition!: MapCoordinates;
}

export class RenameTransferPointAction implements Action {
    @IsValue('[TransferPoint] Rename TransferPoint' as const)
    public readonly type = '[TransferPoint] Rename TransferPoint';

    @IsUUID(4, uuidValidationOptions)
    public readonly transferPointId!: UUID;

    @IsOptional()
    @IsString()
    public readonly internalName?: string;

    @IsOptional()
    @IsString()
    public readonly externalName?: string;
}

export class RemoveTransferPointAction implements Action {
    @IsValue('[TransferPoint] Remove TransferPoint' as const)
    public readonly type = '[TransferPoint] Remove TransferPoint';

    @IsUUID(4, uuidValidationOptions)
    public readonly transferPointId!: UUID;
}

export class ConnectTransferPointsAction implements Action {
    @IsValue('[TransferPoint] Connect TransferPoints' as const)
    public readonly type = '[TransferPoint] Connect TransferPoints';

    @IsUUID(4, uuidValidationOptions)
    public readonly transferPointId1!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly transferPointId2!: UUID;

    @IsOptional()
    @IsNumber()
    public readonly duration?: number;
}

export class DisconnectTransferPointsAction implements Action {
    @IsValue('[TransferPoint] Disconnect TransferPoints' as const)
    public readonly type = '[TransferPoint] Disconnect TransferPoints';

    @IsUUID(4, uuidValidationOptions)
    public readonly transferPointId1!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly transferPointId2!: UUID;
}

export class ConnectHospitalAction implements Action {
    @IsValue('[TransferPoint] Connect hospital' as const)
    public readonly type = '[TransferPoint] Connect hospital';
    @IsUUID(4, uuidValidationOptions)
    public readonly hospitalId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly transferPointId!: UUID;
}

export class DisconnectHospitalAction implements Action {
    @IsValue('[TransferPoint] Disconnect hospital' as const)
    public readonly type = '[TransferPoint] Disconnect hospital';
    @IsUUID(4, uuidValidationOptions)
    public readonly hospitalId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly transferPointId!: UUID;
}

export namespace TransferPointActionReducers {
    export const addTransferPoint: ActionReducer<AddTransferPointAction> = {
        action: AddTransferPointAction,
        reducer: (draftState, { transferPoint }) => {
            draftState.transferPoints[transferPoint.id] =
                cloneDeepMutable(transferPoint);
            return draftState;
        },
        rights: 'trainer',
    };

    export const moveTransferPoint: ActionReducer<MoveTransferPointAction> = {
        action: MoveTransferPointAction,
        reducer: (draftState, { transferPointId, targetPosition }) => {
            changePositionWithId(
                transferPointId,
                newMapPositionAt(targetPosition),
                'transferPoint',
                draftState
            );
            return draftState;
        },
        rights: 'trainer',
    };

    export const renameTransferPoint: ActionReducer<RenameTransferPointAction> =
        {
            action: RenameTransferPointAction,
            reducer: (
                draftState,
                { transferPointId, internalName, externalName }
            ) => {
                const transferPoint = getElement(
                    draftState,
                    'transferPoint',
                    transferPointId
                );
                // Empty strings are ignored
                if (internalName) {
                    transferPoint.internalName = internalName;
                }
                if (externalName) {
                    transferPoint.externalName = externalName;
                }
                return draftState;
            },
            rights: 'trainer',
        };

    export const connectTransferPoints: ActionReducer<ConnectTransferPointsAction> =
        {
            action: ConnectTransferPointsAction,
            reducer: (
                draftState,
                { transferPointId1, transferPointId2, duration }
            ) => {
                // If the transferPoints are already connected, we only update the duration
                // TODO: We currently only support bidirectional connections between different transfer points.
                if (transferPointId1 === transferPointId2) {
                    throw new ReducerError(
                        `TransferPoint with id ${transferPointId1} cannot connect to itself`
                    );
                }
                const transferPoint1 = getElement(
                    draftState,
                    'transferPoint',
                    transferPointId1
                );
                const transferPoint2 = getElement(
                    draftState,
                    'transferPoint',
                    transferPointId2
                );
                const _duration =
                    duration ??
                    estimateDuration(
                        nestedCoordinatesOf(transferPoint1, draftState),
                        nestedCoordinatesOf(transferPoint2, draftState)
                    );
                transferPoint1.reachableTransferPoints[transferPointId2] = {
                    duration: _duration,
                };
                transferPoint2.reachableTransferPoints[transferPointId1] = {
                    duration: _duration,
                };

                logTransferPointConnection(
                    draftState,
                    transferPointId1,
                    transferPointId2,
                    'transferPoint'
                );

                return draftState;
            },
            rights: 'trainer',
        };

    export const disconnectTransferPoints: ActionReducer<DisconnectTransferPointsAction> =
        {
            action: DisconnectTransferPointsAction,
            reducer: (draftState, { transferPointId1, transferPointId2 }) => {
                // We remove the connection from both directions
                if (transferPointId1 === transferPointId2) {
                    throw new ReducerError(
                        `TransferPoint with id ${transferPointId1} cannot disconnect from itself`
                    );
                }
                const transferPoint1 = getElement(
                    draftState,
                    'transferPoint',
                    transferPointId1
                );
                const transferPoint2 = getElement(
                    draftState,
                    'transferPoint',
                    transferPointId2
                );
                delete transferPoint1.reachableTransferPoints[transferPointId2];
                delete transferPoint2.reachableTransferPoints[transferPointId1];

                logTransferPointConnectionRemoved(
                    draftState,
                    transferPointId1,
                    transferPointId2,
                    'transferPoint'
                );

                return draftState;
            },
            rights: 'trainer',
        };

    export const removeTransferPoint: ActionReducer<RemoveTransferPointAction> =
        {
            action: RemoveTransferPointAction,
            reducer: (draftState, { transferPointId }) => {
                // check if transferPoint exists
                getElement(draftState, 'transferPoint', transferPointId);
                // TODO: make it dynamic (if at any time something else is able to transfer this part needs to be changed accordingly)
                // Let all vehicles and personnel arrive that are on transfer to this transferPoint before deleting it
                for (const vehicleId of Object.keys(draftState.vehicles)) {
                    const vehicle = getElement(
                        draftState,
                        'vehicle',
                        vehicleId
                    );
                    if (
                        isInTransfer(vehicle) &&
                        currentTransferOf(vehicle).targetTransferPointId ===
                            transferPointId
                    ) {
                        letElementArrive(draftState, vehicle.type, vehicleId);
                    }
                }
                for (const personnelId of Object.keys(draftState.personnel)) {
                    const personnel = getElement(
                        draftState,
                        'personnel',
                        personnelId
                    );
                    if (
                        isInTransfer(personnel) &&
                        currentTransferOf(personnel).targetTransferPointId ===
                            transferPointId
                    ) {
                        letElementArrive(
                            draftState,
                            personnel.type,
                            personnelId
                        );
                    }
                }
                // TODO: If we can assume that the transfer points are always connected to each other,
                // we could just iterate over draftState.transferPoints[transferPointId].reachableTransferPoints
                for (const transferPoint of Object.values(
                    draftState.transferPoints
                )) {
                    for (const connectedTransferPointId of Object.keys(
                        transferPoint.reachableTransferPoints
                    )) {
                        const connectedTransferPoint =
                            draftState.transferPoints[
                                connectedTransferPointId
                            ]!;
                        delete connectedTransferPoint.reachableTransferPoints[
                            transferPointId
                        ];
                    }
                }
                delete draftState.transferPoints[transferPointId];
                return draftState;
            },
            rights: 'trainer',
        };

    export const connectHospital: ActionReducer<ConnectHospitalAction> = {
        action: ConnectHospitalAction,
        reducer: (draftState, { transferPointId, hospitalId }) => {
            // Check if hospital with this Id exists
            getElement(draftState, 'hospital', hospitalId);
            const transferPoint = getElement(
                draftState,
                'transferPoint',
                transferPointId
            );
            transferPoint.reachableHospitals[hospitalId] = true;

            logTransferPointConnection(
                draftState,
                transferPointId,
                hospitalId,
                'hospital'
            );

            return draftState;
        },
        rights: 'trainer',
    };

    export const disconnectHospital: ActionReducer<DisconnectHospitalAction> = {
        action: DisconnectHospitalAction,
        reducer: (draftState, { hospitalId, transferPointId }) => {
            // Check if hospital with this Id exists
            getElement(draftState, 'hospital', hospitalId);
            const transferPoint = getElement(
                draftState,
                'transferPoint',
                transferPointId
            );
            delete transferPoint.reachableHospitals[hospitalId];

            logTransferPointConnectionRemoved(
                draftState,
                transferPointId,
                hospitalId,
                'hospital'
            );

            return draftState;
        },
        rights: 'trainer',
    };
}

// Helpers

/**
 *
 * @returns an estimated duration in ms to drive between the the two given positions
 * The resulting value is a multiple of 0.1 minutes.
 */
function estimateDuration(
    startPosition: MapCoordinates,
    targetPosition: MapCoordinates
) {
    // TODO: tweak these values more
    // How long in ms it takes to start + stop moving
    const overheadSummand = 10 * 1000;
    // In meters per second
    // On average an RTW drives 11.5 m/s (41.3 km/h https://www.leitstelle-lausitz.de/leitstelle/haeufig-gestellte-fragen/#:~:text=Wie%20viel%20schneller%20ist%20ein,30%2C4%20km%2Fh.)
    // Be aware that this could be significantly off for longer distances due to, e.g., the use of the Autobahn.
    const averageSpeed = 11.5;
    // How many times longer is the actual driving distance in contrast to the distance as the crow flies?
    // A good heuristic is 1.3 (https://forum.openstreetmap.org/viewtopic.php?id=3941)
    const distanceFactor = 1.3;
    const estimateTime =
        overheadSummand +
        ((distanceFactor * calculateDistance(startPosition, targetPosition)) /
            averageSpeed) *
            // Convert to milliseconds
            1000;
    const multipleOf = 1000 * 60 * 0.1;
    return Math.round(estimateTime / multipleOf) * multipleOf;
}
