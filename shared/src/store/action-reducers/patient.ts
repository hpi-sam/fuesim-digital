import type { Immutable, WritableDraft } from 'immer';
import { z } from 'zod';
import type { ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import {
    changePosition,
    changePositionWithId,
} from '../../models/utils/position/position-helpers-mutable.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import {
    currentCoordinatesOf,
    currentSimulatedRegionIdOf,
    currentSimulatedRegionOf,
    isInSimulatedRegion,
    isOnMap,
} from '../../models/utils/position/position-helpers.js';
import { sendSimulationEvent } from '../../simulation/events/utils.js';
import { newPatientRemovedEvent } from '../../simulation/events/patient-removed.js';
import type { ExerciseState } from '../../state.js';
import { type UUID } from '../../utils/uuid.js';
import { patientSchema } from '../../models/patient.js';
import { mapCoordinatesSchema } from '../../models/utils/position/map-coordinates.js';
import { patientStatusSchema } from '../../models/utils/patient-status.js';
import { removeElementPosition } from './utils/spatial-elements.js';
import { updateTreatments } from './utils/calculate-treatments.js';
import { logPatientAdded, logPatientRemoved } from './utils/log.js';
import { getElement } from './utils/get-element.js';

/**
 * Performs all necessary actions to remove a patient from the state.
 * This includes deleting all treatments, removing it from the spatial tree and sending a {@link PatientRemovedEvent} if the patient is in a simulated region.
 * @param patientId The ID of the patient to be deleted
 */
export function deletePatient(
    draftState: WritableDraft<ExerciseState>,
    patientId: UUID
) {
    const patient = getElement(draftState, 'patient', patientId);
    if (isInSimulatedRegion(patient)) {
        const simulatedRegion = currentSimulatedRegionOf(draftState, patient);
        sendSimulationEvent(simulatedRegion, newPatientRemovedEvent(patientId));
    }
    removeElementPosition(draftState, 'patient', patientId);
    delete draftState.patients[patientId];
}

const addPatientActionSchema = z.strictObject({
    type: z.literal('[Patient] Add patient'),
    patient: patientSchema,
});
export type AddPatientAction = Immutable<
    z.infer<typeof addPatientActionSchema>
>;

const movePatientActionSchema = z.strictObject({
    type: z.literal('[Patient] Move patient'),
    patientId: patientSchema.shape.id,
    targetPosition: mapCoordinatesSchema,
});
export type MovePatientAction = Immutable<
    z.infer<typeof movePatientActionSchema>
>;

const removePatientFromSimulatedRegionActionSchema = z.strictObject({
    type: z.literal('[Patient] Remove patient from simulated region'),
    patientId: patientSchema.shape.id,
});
export type RemovePatientFromSimulatedRegionAction = Immutable<
    z.infer<typeof removePatientFromSimulatedRegionActionSchema>
>;

const removePatientActionSchema = z.strictObject({
    type: z.literal('[Patient] Remove patient'),
    patientId: patientSchema.shape.id,
});
export type RemovePatientAction = Immutable<
    z.infer<typeof removePatientActionSchema>
>;

const setVisibleStatusActionSchema = z.strictObject({
    type: z.literal('[Patient] Set Visible Status'),
    patientId: patientSchema.shape.id,
    patientStatus: patientStatusSchema,
});
export type SetVisibleStatusAction = Immutable<
    z.infer<typeof setVisibleStatusActionSchema>
>;

const setUserTextActionSchema = z.strictObject({
    type: z.literal('[Patient] Set Remarks'),
    patientId: patientSchema.shape.id,
    remarks: z.string().max(65535),
});
export type SetUserTextAction = Immutable<
    z.infer<typeof setUserTextActionSchema>
>;

const setCustomQRCodeActionSchema = z.strictObject({
    type: z.literal('[Patient] Set Custom QR Code'),
    patientId: patientSchema.shape.id,
    customQRCode: z.string().max(65535),
});
export type SetCustomQRCodeAction = Immutable<
    z.infer<typeof setCustomQRCodeActionSchema>
>;

const setPatientTransportPriorityActionSchema = z.strictObject({
    type: z.literal('[Patient] Set Transport Priority'),
    patientId: patientSchema.shape.id,
    hasTransportPriority: z.boolean(),
});
export type SetPatientTransportPriorityAction = Immutable<
    z.infer<typeof setPatientTransportPriorityActionSchema>
>;

export namespace PatientActionReducers {
    export const setPatientTransportPriority: ActionReducer<SetPatientTransportPriorityAction> =
        {
            type: setPatientTransportPriorityActionSchema.shape.type.value,
            actionSchema: setPatientTransportPriorityActionSchema,
            reducer: (draftState, { patientId, hasTransportPriority }) => {
                const patient = getElement(draftState, 'patient', patientId);
                if (patient.hasTransportPriority !== hasTransportPriority) {
                    patient.hasTransportPriority = hasTransportPriority;
                }

                return draftState;
            },
            rights: 'participant',
        };

    export const addPatient: ActionReducer<AddPatientAction> = {
        type: addPatientActionSchema.shape.type.value,
        actionSchema: addPatientActionSchema,
        reducer: (draftState, { patient }) => {
            if (
                Object.entries(patient.healthStates).some(
                    ([id, healthState]) => healthState.id !== id
                )
            ) {
                throw new ReducerError(
                    "Not all health state's ids match their key id"
                );
            }
            Object.values(patient.healthStates).forEach((healthState) => {
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
        type: movePatientActionSchema.shape.type.value,
        actionSchema: movePatientActionSchema,
        reducer: (draftState, { patientId, targetPosition }) => {
            changePositionWithId(
                patientId,
                newMapPositionAt(targetPosition),
                'patient',
                draftState
            );
            return draftState;
        },
        rights: 'participant',
    };

    export const removePatientFromSimulatedRegion: ActionReducer<RemovePatientFromSimulatedRegionAction> =
        {
            type: removePatientFromSimulatedRegionActionSchema.shape.type.value,
            actionSchema: removePatientFromSimulatedRegionActionSchema,
            reducer: (draftState, { patientId }) => {
                const patient = getElement(draftState, 'patient', patientId);

                if (!isInSimulatedRegion(patient)) {
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
                    newPatientRemovedEvent(patientId)
                );

                const coordinates = cloneDeepMutable(
                    currentCoordinatesOf(simulatedRegion)
                );

                // place the patient on the right hand side of the simulated region

                coordinates.y -= 0.5 * simulatedRegion.size.height;
                coordinates.x += 5 + Math.max(simulatedRegion.size.width, 0);

                changePositionWithId(
                    patientId,
                    newMapPositionAt(coordinates),
                    'patient',
                    draftState
                );

                return draftState;
            },
            rights: 'trainer',
        };

    export const removePatient: ActionReducer<RemovePatientAction> = {
        type: removePatientActionSchema.shape.type.value,
        actionSchema: removePatientActionSchema,
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
                    newPatientRemovedEvent(patientId)
                );
            }
            logPatientRemoved(draftState, patientId);
            deletePatient(draftState, patientId);
            return draftState;
        },
        rights: 'trainer',
    };

    export const setVisibleStatus: ActionReducer<SetVisibleStatusAction> = {
        type: setVisibleStatusActionSchema.shape.type.value,
        actionSchema: setVisibleStatusActionSchema,
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

    export const setUserText: ActionReducer<SetUserTextAction> = {
        type: setUserTextActionSchema.shape.type.value,
        actionSchema: setUserTextActionSchema,
        reducer: (draftState, { patientId, remarks }) => {
            const patient = getElement(draftState, 'patient', patientId);
            patient.remarks = remarks;
            return draftState;
        },
        rights: 'participant',
    };

    export const setCustomQRCode: ActionReducer<SetCustomQRCodeAction> = {
        type: setCustomQRCodeActionSchema.shape.type.value,
        actionSchema: setCustomQRCodeActionSchema,
        reducer: (draftState, { patientId, customQRCode }) => {
            const patient = getElement(draftState, 'patient', patientId);
            patient.customQRCode = customQRCode;
            return draftState;
        },
        rights: 'participant',
    };
}
