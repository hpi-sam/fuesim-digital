import { z } from 'zod';
import type { Immutable } from 'immer';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import type { ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { transferPointSchema } from '../../models/transfer-point.js';
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
import { hospitalSchema } from '../../models/hospital.js';
import { getElement } from './utils/get-element.js';
import {
    logTransferPointConnection,
    logTransferPointConnectionRemoved,
} from './utils/log.js';
import { letElementArrive } from './transfer.js';
import { calculateDistance } from './utils/calculate-distance.js';

const addTransferPointActionSchema = z.strictObject({
    type: z.literal('[TransferPoint] Add TransferPoint'),
    transferPoint: transferPointSchema,
});
export type AddTransferPointAction = Immutable<
    z.infer<typeof addTransferPointActionSchema>
>;

const moveTransferPointActionSchema = z.strictObject({
    type: z.literal('[TransferPoint] Move TransferPoint'),
    transferPointId: transferPointSchema.shape.id,
    targetPosition: mapCoordinatesSchema,
});
export type MoveTransferPointAction = Immutable<
    z.infer<typeof moveTransferPointActionSchema>
>;

const renameTransferPointActionSchema = z.strictObject({
    type: z.literal('[TransferPoint] Rename TransferPoint'),
    transferPointId: transferPointSchema.shape.id,
    internalName: transferPointSchema.shape.internalName.optional(),
    externalName: transferPointSchema.shape.externalName.optional(),
});
export type RenameTransferPointAction = Immutable<
    z.infer<typeof renameTransferPointActionSchema>
>;

const removeTransferPointActionSchema = z.strictObject({
    type: z.literal('[TransferPoint] Remove TransferPoint'),
    transferPointId: transferPointSchema.shape.id,
});
export type RemoveTransferPointAction = Immutable<
    z.infer<typeof removeTransferPointActionSchema>
>;

const connectTransferPointsActionSchema = z.strictObject({
    type: z.literal('[TransferPoint] Connect TransferPoints'),
    transferPointId1: transferPointSchema.shape.id,
    transferPointId2: transferPointSchema.shape.id,
    duration: z.number().optional(),
});
export type ConnectTransferPointsAction = Immutable<
    z.infer<typeof connectTransferPointsActionSchema>
>;

const disconnectTransferPointsActionSchema = z.strictObject({
    type: z.literal('[TransferPoint] Disconnect TransferPoints'),
    transferPointId1: transferPointSchema.shape.id,
    transferPointId2: transferPointSchema.shape.id,
});
export type DisconnectTransferPointsAction = Immutable<
    z.infer<typeof disconnectTransferPointsActionSchema>
>;

const connectHospitalActionSchema = z.strictObject({
    type: z.literal('[TransferPoint] Connect hospital'),
    hospitalId: hospitalSchema.shape.id,
    transferPointId: transferPointSchema.shape.id,
});
export type ConnectHospitalAction = Immutable<
    z.infer<typeof connectHospitalActionSchema>
>;

const disconnectHospitalActionSchema = z.strictObject({
    type: z.literal('[TransferPoint] Disconnect hospital'),
    hospitalId: hospitalSchema.shape.id,
    transferPointId: transferPointSchema.shape.id,
});
export type DisconnectHospitalAction = Immutable<
    z.infer<typeof disconnectHospitalActionSchema>
>;

export namespace TransferPointActionReducers {
    export const addTransferPoint: ActionReducer<AddTransferPointAction> = {
        type: addTransferPointActionSchema.shape.type.value,
        actionSchema: addTransferPointActionSchema,
        reducer: (draftState, { transferPoint }) => {
            draftState.transferPoints[transferPoint.id] =
                cloneDeepMutable(transferPoint);
            return draftState;
        },
        rights: 'trainer',
    };

    export const moveTransferPoint: ActionReducer<MoveTransferPointAction> = {
        type: moveTransferPointActionSchema.shape.type.value,
        actionSchema: moveTransferPointActionSchema,
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
            type: renameTransferPointActionSchema.shape.type.value,
            actionSchema: renameTransferPointActionSchema,
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
            type: connectTransferPointsActionSchema.shape.type.value,
            actionSchema: connectTransferPointsActionSchema,
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
            type: disconnectTransferPointsActionSchema.shape.type.value,
            actionSchema: disconnectTransferPointsActionSchema,
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
            type: removeTransferPointActionSchema.shape.type.value,
            actionSchema: removeTransferPointActionSchema,
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
        type: connectHospitalActionSchema.shape.type.value,
        actionSchema: connectHospitalActionSchema,
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
        type: disconnectHospitalActionSchema.shape.type.value,
        actionSchema: disconnectHospitalActionSchema,
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
