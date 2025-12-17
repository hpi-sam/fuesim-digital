import { IsOptional, IsString, IsUUID } from 'class-validator';
import {
    MissingTransferConnectionRadiogram,
    RadiogramUnpublishedStatus,
} from '../../models/radiogram/index.js';
import { publishRadiogram } from '../../models/radiogram/radiogram-helpers-mutable.js';
import {
    type ExerciseOccupation,
    newTransferStartPoint,
    exerciseOccupationSchema,
    ResourceDescription,
    changeOccupation,
    getCreate,
    isInSpecificSimulatedRegion,
    isInSpecificVehicle,
    VehicleResource,
    newNoOccupation,
} from '../../models/index.js';
import { TransferActionReducers } from '../../store/action-reducers/transfer.js';
import {
    getElement,
    getElementByPredicate,
    tryGetElement,
} from '../../store/action-reducers/utils/index.js';
import type { UUID } from '../../utils/index.js';
import { cloneDeepMutable, uuidValidationOptions } from '../../utils/index.js';
import { IsLiteralUnion, IsValue } from '../../utils/validators/index.js';
import {
    TransferConnectionMissingEvent,
    VehicleTransferSuccessfulEvent,
} from '../events/index.js';
import { sendSimulationEvent } from '../events/utils.js';
import { nextUUID } from '../utils/randomness.js';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeAllowedValues } from '../utils/transfer-destination.js';
import { HospitalActionReducers } from '../../store/action-reducers/hospital.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import type {
    SimulationActivity,
    SimulationActivityState,
} from './simulation-activity.js';

export class TransferVehicleActivityState implements SimulationActivityState {
    @IsValue('transferVehicleActivity' as const)
    public readonly type = 'transferVehicleActivity';

    @IsUUID(4, uuidValidationOptions)
    readonly id: UUID;

    @IsUUID(4, uuidValidationOptions)
    readonly vehicleId: UUID;

    @IsLiteralUnion(transferDestinationTypeAllowedValues)
    readonly transferDestinationType: TransferDestination;

    @IsUUID(4, uuidValidationOptions)
    readonly transferDestinationId: UUID;

    @IsZodSchema(exerciseOccupationSchema.optional())
    readonly successorOccupation?: ExerciseOccupation;

    @IsOptional()
    @IsString()
    readonly key?: string;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        id: UUID,
        vehicleId: UUID,
        transferDestinationType: TransferDestination,
        transferDestinationId: UUID,
        key?: string,
        successorOccupation?: ExerciseOccupation
    ) {
        this.id = id;
        this.vehicleId = vehicleId;

        this.transferDestinationType = transferDestinationType;
        this.transferDestinationId = transferDestinationId;
        this.key = key;
        this.successorOccupation = successorOccupation;
    }

    static readonly create = getCreate(this);
}

export const transferVehicleActivity: SimulationActivity<TransferVehicleActivityState> =
    {
        activityState: TransferVehicleActivityState,
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
                            TransferConnectionMissingEvent.create(
                                activityState.transferDestinationId,
                                activityState.key
                            )
                        );
                        publishRadiogram(
                            draftState,
                            cloneDeepMutable(
                                MissingTransferConnectionRadiogram.create(
                                    nextUUID(draftState),
                                    simulatedRegion.id,
                                    RadiogramUnpublishedStatus.create(),
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
                VehicleTransferSuccessfulEvent.create(
                    activityState.transferDestinationId,
                    activityState.key ?? '',
                    VehicleResource.create(vehicleResourceDescription)
                )
            );

            terminate();
        },
    };
