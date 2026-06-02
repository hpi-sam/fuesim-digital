import { z } from 'zod';
import type { Immutable } from 'immer';
import { hospitalSchema } from '../../models/hospital.js';
import { newHospitalPatientFromPatient } from '../../models/hospital-patient.js';
import type { ActionReducer } from '../action-reducer.js';
import { ExpectedReducerError } from '../reducer-error.js';
import { catchAllHospitalId } from '../../data/default-state/catch-all-hospital.js';
import { createHospitalTag } from '../../models/utils/tag-helpers.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { vehicleSchema } from '../../models/vehicle.js';
import { isCompletelyLoaded } from './utils/completely-load-vehicle.js';
import { getElement } from './utils/get-element.js';
import { deleteVehicle } from './vehicle.js';
import { logVehicle } from './utils/log.js';

export const addHospitalActionSchema = z.strictObject({
    type: z.literal('[Hospital] Add hospital'),
    hospital: hospitalSchema,
});
export type AddHospitalAction = Immutable<
    z.infer<typeof addHospitalActionSchema>
>;

export const editTransportDurationToHospitalActionSchema = z.strictObject({
    type: z.literal('[Hospital] Edit transportDuration to hospital'),
    hospitalId: hospitalSchema.shape.id,
    transportDuration: z.number().nonnegative(),
});
export type EditTransportDurationToHospitalAction = Immutable<
    z.infer<typeof editTransportDurationToHospitalActionSchema>
>;

export const renameHospitalActionSchema = z.strictObject({
    type: z.literal('[Hospital] Rename hospital'),
    hospitalId: hospitalSchema.shape.id,
    name: z.string(),
});
export type RenameHospitalAction = Immutable<
    z.infer<typeof renameHospitalActionSchema>
>;

export const removeHospitalActionSchema = z.strictObject({
    type: z.literal('[Hospital] Remove hospital'),
    hospitalId: hospitalSchema.shape.id,
});
export type RemoveHospitalAction = Immutable<
    z.infer<typeof removeHospitalActionSchema>
>;

export const transportPatientToHospitalActionSchema = z.strictObject({
    type: z.literal('[Hospital] Transport patient to hospital'),
    hospitalId: hospitalSchema.shape.id,
    vehicleId: vehicleSchema.shape.id,
});
export type TransportPatientToHospitalAction = Immutable<
    z.infer<typeof transportPatientToHospitalActionSchema>
>;

export namespace HospitalActionReducers {
    export const addHospital: ActionReducer<AddHospitalAction> = {
        type: '[Hospital] Add hospital',
        actionSchema: addHospitalActionSchema,
        reducer: (draftState, { hospital }) => {
            draftState.hospitals[hospital.id] = cloneDeepMutable(hospital);
            return draftState;
        },
        rights: 'trainer',
    };

    export const editTransportDurationToHospital: ActionReducer<EditTransportDurationToHospitalAction> =
        {
            type: '[Hospital] Edit transportDuration to hospital',
            actionSchema: editTransportDurationToHospitalActionSchema,
            reducer: (draftState, { hospitalId, transportDuration }) => {
                const hospital = getElement(draftState, 'hospital', hospitalId);
                hospital.transportDuration = transportDuration;
                return draftState;
            },
            rights: 'trainer',
        };

    export const renameHospital: ActionReducer<RenameHospitalAction> = {
        type: '[Hospital] Rename hospital',
        actionSchema: renameHospitalActionSchema,
        reducer: (draftState, { hospitalId, name }) => {
            const hospital = getElement(draftState, 'hospital', hospitalId);
            hospital.name = name;
            return draftState;
        },
        rights: 'trainer',
    };

    export const removeHospital: ActionReducer<RemoveHospitalAction> = {
        type: '[Hospital] Remove hospital',
        actionSchema: removeHospitalActionSchema,
        reducer: (draftState, { hospitalId }) => {
            if (hospitalId === catchAllHospitalId) {
                throw new ExpectedReducerError(
                    'Dieses Krankenhaus darf aus technischen Gründen nicht gelöscht werden.'
                );
            }

            const hospital = getElement(draftState, 'hospital', hospitalId);
            // TODO: maybe make a hospital undeletable (if at least one patient is in it)
            for (const patientId of Object.keys(hospital.patientIds)) {
                delete draftState.hospitalPatients[patientId];
            }
            for (const transferPoint of Object.values(
                draftState.transferPoints
            )) {
                delete transferPoint.reachableHospitals[hospitalId];
            }
            delete draftState.hospitals[hospitalId];
            return draftState;
        },
        rights: 'trainer',
    };

    export const transportPatientToHospital: ActionReducer<TransportPatientToHospitalAction> =
        {
            type: '[Hospital] Transport patient to hospital',
            actionSchema: transportPatientToHospitalActionSchema,
            reducer: (draftState, { hospitalId, vehicleId }) => {
                const hospital = getElement(draftState, 'hospital', hospitalId);
                const vehicle = getElement(draftState, 'vehicle', vehicleId);

                if (!isCompletelyLoaded(draftState, vehicle)) {
                    throw new ExpectedReducerError(
                        'Das Fahrzeug kann nur ein Krankenhaus anfahren, wenn Personal und Material eingestiegen sind.'
                    );
                }

                logVehicle(
                    draftState,
                    [createHospitalTag(draftState, hospitalId)],
                    `${vehicle.name} hat ein Krankenhaus angefahren`,
                    vehicleId
                );

                for (const patientId of Object.keys(vehicle.patientIds)) {
                    const patient = getElement(
                        draftState,
                        'patient',
                        patientId
                    );
                    draftState.hospitalPatients[patientId] =
                        newHospitalPatientFromPatient(
                            patient,
                            vehicle.vehicleType,
                            draftState.currentTime,
                            hospital.transportDuration + draftState.currentTime
                        );
                    hospital.patientIds[patientId] = true;
                }
                deleteVehicle(draftState, vehicleId);
                return draftState;
            },
            rights: 'participant',
        };
}
