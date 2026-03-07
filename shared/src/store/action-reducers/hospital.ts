import { IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { type Hospital, hospitalSchema } from '../../models/hospital.js';
import { newHospitalPatientFromPatient } from '../../models/hospital-patient.js';
import type { UUID } from '../../utils/index.js';
import { cloneDeepMutable, uuidValidationOptions } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ExpectedReducerError } from '../reducer-error.js';
import { catchAllHospitalId } from '../../data/default-state/catch-all-hospital.js';
import { createHospitalTag } from '../../models/utils/tag-helpers.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { isCompletelyLoaded } from './utils/completely-load-vehicle.js';
import { getElement } from './utils/get-element.js';
import { deleteVehicle } from './vehicle.js';
import { logVehicle } from './utils/log.js';

export class AddHospitalAction implements Action {
    @IsValue('[Hospital] Add hospital' as const)
    public readonly type = '[Hospital] Add hospital';
    @IsZodSchema(hospitalSchema)
    public readonly hospital!: Hospital;
}

export class EditTransportDurationToHospitalAction implements Action {
    @IsValue('[Hospital] Edit transportDuration to hospital' as const)
    public readonly type = '[Hospital] Edit transportDuration to hospital';
    @IsUUID(4, uuidValidationOptions)
    public readonly hospitalId!: UUID;

    @IsNumber()
    @Min(0)
    public readonly transportDuration!: number;
}

export class RenameHospitalAction implements Action {
    @IsValue('[Hospital] Rename hospital' as const)
    public readonly type = '[Hospital] Rename hospital';
    @IsUUID(4, uuidValidationOptions)
    public readonly hospitalId!: UUID;

    @IsString()
    public readonly name!: string;
}

export class RemoveHospitalAction implements Action {
    @IsValue('[Hospital] Remove hospital' as const)
    public readonly type = '[Hospital] Remove hospital';
    @IsUUID(4, uuidValidationOptions)
    public readonly hospitalId!: UUID;
}

export class TransportPatientToHospitalAction implements Action {
    @IsValue('[Hospital] Transport patient to hospital' as const)
    public readonly type = '[Hospital] Transport patient to hospital';
    @IsUUID(4, uuidValidationOptions)
    public readonly hospitalId!: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId!: UUID;
}

export namespace HospitalActionReducers {
    export const addHospital: ActionReducer<AddHospitalAction> = {
        action: AddHospitalAction,
        reducer: (draftState, { hospital }) => {
            draftState.hospitals[hospital.id] = cloneDeepMutable(hospital);
            return draftState;
        },
        rights: 'trainer',
    };

    export const editTransportDurationToHospital: ActionReducer<EditTransportDurationToHospitalAction> =
        {
            action: EditTransportDurationToHospitalAction,
            reducer: (draftState, { hospitalId, transportDuration }) => {
                const hospital = getElement(draftState, 'hospital', hospitalId);
                hospital.transportDuration = transportDuration;
                return draftState;
            },
            rights: 'trainer',
        };

    export const renameHospital: ActionReducer<RenameHospitalAction> = {
        action: RenameHospitalAction,
        reducer: (draftState, { hospitalId, name }) => {
            const hospital = getElement(draftState, 'hospital', hospitalId);
            hospital.name = name;
            return draftState;
        },
        rights: 'trainer',
    };

    export const removeHospital: ActionReducer<RemoveHospitalAction> = {
        action: RemoveHospitalAction,
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
            action: TransportPatientToHospitalAction,
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
