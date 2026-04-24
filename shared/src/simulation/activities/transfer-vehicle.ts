import { z } from 'zod';
import { publishRadiogram } from '../../models/radiogram/radiogram-helpers-mutable.js';
import { sendSimulationEvent } from '../events/utils.js';
import { nextUUID } from '../utils/randomness.js';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeSchema } from '../utils/transfer-destination.js';
import { HospitalActionReducers } from '../../store/action-reducers/hospital.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import {
    type ExerciseOccupation,
    exerciseOccupationSchema,
} from '../../models/utils/occupations/exercise-occupation.js';
import {
    getElement,
    getElementByPredicate,
    tryGetElement,
} from '../../store/action-reducers/utils/get-element.js';
import {
    isInSpecificSimulatedRegion,
    isInSpecificVehicle,
} from '../../models/utils/position/position-helpers.js';
import { changeOccupation } from '../../models/utils/occupations/occupation-helpers-mutable.js';
import { newNoOccupation } from '../../models/utils/occupations/no-occupation.js';
import { newTransferConnectionMissingEvent } from '../events/transfer-connection-missing.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { newMissingTransferConnectionRadiogram } from '../../models/radiogram/missing-transfer-connection-radiogram.js';
import { newRadiogramUnpublishedStatus } from '../../models/radiogram/status/radiogram-unpublished-status.js';
import { TransferActionReducers } from '../../store/action-reducers/transfer.js';
import { newTransferStartPoint } from '../../models/utils/start-points.js';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import { newVehicleTransferSuccessfulEvent } from '../events/vehicle-transfer-successful.js';
import { newVehicleResource } from '../../models/utils/rescue-resource.js';
import { simulationActivityStateSchema } from './simulation-activity.js';
import type { SimulationActivity } from './simulation-activity.js';

export const transferVehicleActivityStateSchema = z.strictObject({
    ...simulationActivityStateSchema.shape,
    type: z.literal('transferVehicleActivity'),
    vehicleId: uuidSchema,
    transferDestinationType: transferDestinationTypeSchema,
    transferDestinationId: uuidSchema,
    successorOccupation: exerciseOccupationSchema.optional(),
    key: z.string().optional(),
});
export type TransferVehicleActivityState = z.infer<
    typeof transferVehicleActivityStateSchema
>;

export function newTransferVehicleActivityState(
    id: UUID,
    vehicleId: UUID,
    transferDestinationType: TransferDestination,
    transferDestinationId: UUID,
    key?: string,
    successorOccupation?: ExerciseOccupation
): TransferVehicleActivityState {
    return {
        id,
        type: 'transferVehicleActivity',
        vehicleId,
        transferDestinationType,
        transferDestinationId,
        key,
        successorOccupation,
    };
}

export const transferVehicleActivity: SimulationActivity<TransferVehicleActivityState> =
    {
        activityStateSchema: transferVehicleActivityStateSchema,
        tick(
            draftState,
            simulatedRegion,
            activityState,
            _tickInterval,
            terminate
        ) {
            const vehicle = tryGetElement(
                draftState,
                'vehicle',
                activityState.vehicleId
            );

            if (
                vehicle?.occupation.type !== 'waitForTransferOccupation' ||
                !isInSpecificSimulatedRegion(vehicle, simulatedRegion.id)
            ) {
                terminate();
                return;
            }
            if (
                Object.keys(vehicle.materialIds).some((materialId) => {
                    const material = getElement(
                        draftState,
                        'material',
                        materialId
                    );
                    return !isInSpecificVehicle(material, vehicle.id);
                }) ||
                Object.keys(vehicle.personnelIds).some((personnelId) => {
                    const personnel = getElement(
                        draftState,
                        'personnel',
                        personnelId
                    );
                    return !isInSpecificVehicle(personnel, vehicle.id);
                })
            ) {
                // If the vehicle is not completely loaded terminate
                terminate();
                return;
            }

            changeOccupation(
                draftState,
                vehicle,
                activityState.successorOccupation ?? newNoOccupation()
            );

            switch (activityState.transferDestinationType) {
                case 'transferPoint': {
                    const ownTransferPoint = getElementByPredicate(
                        draftState,
                        'transferPoint',
                        (transferPoint) =>
                            isInSpecificSimulatedRegion(
                                transferPoint,
                                simulatedRegion.id
                            )
                    );

                    if (
                        ownTransferPoint.reachableTransferPoints[
                            activityState.transferDestinationId
                        ] === undefined
                    ) {
                        sendSimulationEvent(
                            simulatedRegion,
                            newTransferConnectionMissingEvent(
                                activityState.transferDestinationId,
                                activityState.key
                            )
                        );
                        publishRadiogram(
                            draftState,
                            cloneDeepMutable(
                                newMissingTransferConnectionRadiogram(
                                    nextUUID(draftState),
                                    simulatedRegion.id,
                                    newRadiogramUnpublishedStatus(),
                                    activityState.transferDestinationId
                                )
                            )
                        );

                        terminate();
                        return;
                    }

                    TransferActionReducers.addToTransfer.reducer(draftState, {
                        type: '[Transfer] Add to transfer',
                        elementType: 'vehicle',
                        elementId: activityState.vehicleId,
                        startPoint: newTransferStartPoint(ownTransferPoint.id),
                        targetTransferPointId:
                            activityState.transferDestinationId,
                    });

                    terminate();
                    break;
                }
                case 'hospital': {
                    HospitalActionReducers.transportPatientToHospital.reducer(
                        draftState,
                        {
                            type: '[Hospital] Transport patient to hospital',
                            vehicleId: vehicle.id,
                            hospitalId: activityState.transferDestinationId,
                        }
                    );

                    break;
                }
            }

            const vehicleResourceDescription: ResourceDescription = {
                [vehicle.vehicleType]: 1,
            };

            sendSimulationEvent(
                simulatedRegion,
                newVehicleTransferSuccessfulEvent(
                    activityState.transferDestinationId,
                    activityState.key ?? '',
                    newVehicleResource(vehicleResourceDescription)
                )
            );

            terminate();
        },
    };
