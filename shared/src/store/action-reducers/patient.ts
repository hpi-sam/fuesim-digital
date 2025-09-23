import { Type } from 'class-transformer';
import { IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { Patient } from '../../models/patient.js';
import type { PatientStatus } from '../../models/utils/index.js';
import {
    isOnMap,
    MapPosition,
    patientStatusAllowedValues,
    MapCoordinates,
    isNotInSimulatedRegion,
    currentSimulatedRegionIdOf,
    currentCoordinatesOf,
    isInSimulatedRegion,
    currentSimulatedRegionOf,
} from '../../models/utils/index.js';
import {
    changePosition,
    changePositionWithId,
} from '../../models/utils/position/position-helpers-mutable.js';
import type { ExerciseState } from '../../state.js';
import type { Mutable, UUID } from '../../utils/index.js';
import {
    cloneDeepMutable,
    StrictObject,
    uuidValidationOptions,
} from '../../utils/index.js';
import { IsLiteralUnion, IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { PatientRemovedEvent } from '../../simulation/events/index.js';
import { sendSimulationEvent } from '../../simulation/events/utils.js';
import { updateTreatments } from './utils/calculate-treatments.js';
import { getElement } from './utils/get-element.js';
import { removeElementPosition } from './utils/spatial-elements.js';
import { logPatientAdded, logPatientRemoved } from './utils/log.js';

/**
 * Performs all necessary actions to remove a patient from the state.
 * This includes deleting all treatments, removing it from the spatial tree and sending a {@link PatientRemovedEvent} if the patient is in a simulated region.
 * @param patientId The ID of the patient to be deleted
 */
export function deletePatient(
    draftState: Mutable<ExerciseState>,
    patientId: UUID
) {
    const patient = getElement(draftState, 'patient', patientId);
    if (isInSimulatedRegion(patient)) {
        const simulatedRegion = currentSimulatedRegionOf(draftState, patient);
        sendSimulationEvent(
            simulatedRegion,
            PatientRemovedEvent.create(patientId)
        );
    }
    removeElementPosition(draftState, 'patient', patientId);
    delete draftState.patients[patientId];
}

export class AddPatientAction implements Action {
    @IsValue('[Patient] Add patient' as const)
    public readonly type = '[Patient] Add patient';
    @ValidateNested()
    @Type(() => Patient)
    public readonly patient!: Patient;
}

export class MovePatientAction implements Action {
    @IsValue('[Patient] Move patient' as const)
    public readonly type = '[Patient] Move patient';

    @IsUUID(4, uuidValidationOptions)
    public readonly patientId!: UUID;

    @ValidateNested()
    @Type(() => MapCoordinates)
    public readonly targetPosition!: MapCoordinates;
}

export class RemovePatientFromSimulatedRegionAction implements Action {
    @IsValue('[Patient] Remove patient from simulated region' as const)
    public readonly type = '[Patient] Remove patient from simulated region';

    @IsUUID(4, uuidValidationOptions)
    public readonly patientId!: UUID;
}

export class RemovePatientAction implements Action {
    @IsValue('[Patient] Remove patient' as const)
    public readonly type = '[Patient] Remove patient';
    @IsUUID(4, uuidValidationOptions)
    public readonly patientId!: UUID;
}

export class SetVisibleStatusAction implements Action {
    @IsValue('[Patient] Set Visible Status' as const)
    public readonly type = '[Patient] Set Visible Status';

    @IsUUID(4, uuidValidationOptions)
    public readonly patientId!: UUID;

    @IsLiteralUnion(patientStatusAllowedValues)
    public readonly patientStatus!: PatientStatus;
}

export class SetUserTextAction implements Action {
    @IsValue('[Patient] Set Remarks' as const)
    public readonly type = '[Patient] Set Remarks';

    @IsUUID(4, uuidValidationOptions)
    public readonly patientId!: UUID;

    @IsString()
    @MaxLength(65535)
    public readonly remarks!: string;
}

export class SetCustomQRCodeAction implements Action {
    @IsValue('[Patient] Set Custom QR Code' as const)
    public readonly type = '[Patient] Set Custom QR Code';

    @IsUUID(4, uuidValidationOptions)
    public readonly patientId!: UUID;

    @IsString()
    @MaxLength(65535)
    public readonly customQRCode!: string;
}

export namespace PatientActionReducers {
    export const addPatient: ActionReducer<AddPatientAction> = {
        action: AddPatientAction,
        reducer: (draftState, { patient }) => {
            if (
                StrictObject.entries(patient.healthStates).some(
                    ([id, healthState]) => healthState.id !== id
                )
            ) {
                throw new ReducerError(
                    "Not all health state's ids match their key id"
                );
            }
            StrictObject.values(patient.healthStates).forEach((healthState) => {
                healthState.nextStateConditions.forEach(
                    (nextStateCondition) => {
                        if (
                            patient.healthStates[
                                nextStateCondition.matchingHealthStateId
                            ] === undefined
                        ) {
                            throw new ReducerError(
                                `HealthState with id ${nextStateCondition.matchingHealthStateId} does not exist`
                            );
                        }
                    }
                );
            });
            if (
                patient.healthStates[patient.currentHealthStateId] === undefined
            ) {
                throw new ReducerError(
                    `HealthState with id ${patient.currentHealthStateId} does not exist`
                );
            }
            const mutablePatient = cloneDeepMutable(patient);
            draftState.patientCounter++;
            const paddedCounter = String(draftState.patientCounter).padStart(
                4,
                '0'
            );
            mutablePatient.identifier = `${draftState.configuration.patientIdentifierPrefix}${paddedCounter}`;
            draftState.patients[mutablePatient.id] = mutablePatient;
            changePosition(mutablePatient, patient.position, draftState);
            logPatientAdded(draftState, patient.id);
            return draftState;
        },
        rights: 'trainer',
    };

    export const movePatient: ActionReducer<MovePatientAction> = {
        action: MovePatientAction,
        reducer: (draftState, { patientId, targetPosition }) => {
            changePositionWithId(
                patientId,
                MapPosition.create(targetPosition),
                'patient',
                draftState
            );
            return draftState;
        },
        rights: 'participant',
    };

    export const removePatientFromSimulatedRegion: ActionReducer<RemovePatientFromSimulatedRegionAction> =
        {
            action: RemovePatientFromSimulatedRegionAction,
            reducer: (draftState, { patientId }) => {
                const patient = getElement(draftState, 'patient', patientId);

                if (isNotInSimulatedRegion(patient)) {
                    throw new ReducerError(
                        `Patient with Id: ${patientId} was expected to be in simulated region but position was of type: ${patient.position.type}`
                    );
                }

                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    currentSimulatedRegionIdOf(patient)
                );
                sendSimulationEvent(
                    simulatedRegion,
                    PatientRemovedEvent.create(patientId)
                );

                const coordinates = cloneDeepMutable(
                    currentCoordinatesOf(simulatedRegion)
                );

                // place the patient on the right hand side of the simulated region

                coordinates.y -= 0.5 * simulatedRegion.size.height;
                coordinates.x += 5 + Math.max(simulatedRegion.size.width, 0);

                changePositionWithId(
                    patientId,
                    MapPosition.create(coordinates),
                    'patient',
                    draftState
                );

                return draftState;
            },
            rights: 'trainer',
        };

    export const removePatient: ActionReducer<RemovePatientAction> = {
        action: RemovePatientAction,
        reducer: (draftState, { patientId }) => {
            const patient = getElement(draftState, 'patient', patientId);
            if (isInSimulatedRegion(patient)) {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    currentSimulatedRegionIdOf(patient)
                );
                sendSimulationEvent(
                    simulatedRegion,
                    PatientRemovedEvent.create(patientId)
                );
            }
            logPatientRemoved(draftState, patientId);
            deletePatient(draftState, patientId);
            return draftState;
        },
        rights: 'trainer',
    };

    export const setVisibleStatus: ActionReducer<SetVisibleStatusAction> = {
        action: SetVisibleStatusAction,
        reducer: (draftState, { patientId, patientStatus }) => {
            const patient = getElement(draftState, 'patient', patientId);
            patient.pretriageStatus = patientStatus;

            if (isOnMap(patient)) {
                updateTreatments(draftState, patient);
            }

            return draftState;
        },
        rights: 'participant',
    };

    export const setUserTextAction: ActionReducer<SetUserTextAction> = {
        action: SetUserTextAction,
        reducer: (draftState, { patientId, remarks }) => {
            const patient = getElement(draftState, 'patient', patientId);
            patient.remarks = remarks;
            return draftState;
        },
        rights: 'participant',
    };

    export const setCustomQRCodeAction: ActionReducer<SetCustomQRCodeAction> = {
        action: SetCustomQRCodeAction,
        reducer: (draftState, { patientId, customQRCode }) => {
            const patient = getElement(draftState, 'patient', patientId);
            patient.customQRCode = customQRCode;
            return draftState;
        },
        rights: 'participant',
    };
}
