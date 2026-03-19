import { z } from 'zod';
import {
    delayEventActivity,
    delayEventActivityStateSchema,
} from './delay-event.js';
import {
    reassignTreatmentsActivity,
    reassignTreatmentsActivityStateSchema,
} from './reassign-treatments.js';
import {
    unloadVehicleActivity,
    unloadVehicleActivityStateSchema,
} from './unload-vehicle.js';
import {
    recurringEventActivity,
    recurringEventActivityStateSchema,
} from './recurring-event.js';
import {
    generateReportActivity,
    generateReportActivityStateSchema,
} from './generate-report.js';
import {
    providePersonnelFromVehiclesActivity,
    providePersonnelFromVehiclesActivitySchema,
} from './provide-personnel-from-vehicles.js';
import {
    createRequestActivity,
    createRequestActivityStateSchema,
} from './create-request.js';
import {
    loadVehicleActivity,
    loadVehicleActivityStateSchema,
} from './load-vehicle.js';
import {
    sendRemoteEventActivity,
    sendRemoteEventActivityStateSchema,
} from './send-remote-event.js';
import {
    transferVehicleActivity,
    transferVehicleActivityStateSchema,
} from './transfer-vehicle.js';
import {
    publishRadiogramActivity,
    publishRadiogramActivityStateSchema,
} from './publish-radiogram.js';
import {
    transferPatientToHospitalActivity,
    transferPatientToHospitalActivityStateSchema,
} from './transfer-patient-to-hospital.js';
import {
    countPatientsActivity,
    countPatientsActivityStateSchema,
} from './count-patients.js';

export const exerciseSimulationActivityStateSchema = z.discriminatedUnion(
    'type',
    [
        reassignTreatmentsActivityStateSchema,
        unloadVehicleActivityStateSchema,
        delayEventActivityStateSchema,
        recurringEventActivityStateSchema,
        generateReportActivityStateSchema,
        providePersonnelFromVehiclesActivitySchema,
        createRequestActivityStateSchema,
        loadVehicleActivityStateSchema,
        sendRemoteEventActivityStateSchema,
        transferVehicleActivityStateSchema,
        publishRadiogramActivityStateSchema,
        transferPatientToHospitalActivityStateSchema,
        countPatientsActivityStateSchema,
    ]
);

export type ExerciseSimulationActivityState = z.infer<
    typeof exerciseSimulationActivityStateSchema
>;

export type ExerciseSimulationActivityType =
    ExerciseSimulationActivityState['type'];

export const simulationActivityDictionary = {
    reassignTreatmentsActivity,
    unloadVehicleActivity,
    delayEventActivity,
    recurringEventActivity,
    generateReportActivity,
    providePersonnelFromVehiclesActivity,
    createRequestActivity,
    loadVehicleActivity,
    sendRemoteEventActivity,
    transferVehicleActivity,
    publishRadiogramActivity,
    transferPatientToHospitalActivity,
    countPatientsActivity,
} as const;
