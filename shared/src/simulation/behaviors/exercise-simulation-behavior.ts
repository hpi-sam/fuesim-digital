import { z } from 'zod';
import {
    assignLeaderBehavior,
    assignLeaderBehaviorStateSchema,
} from './assign-leader.js';
import {
    treatPatientsBehavior,
    treatPatientsBehaviorStateSchema,
} from './treat-patients.js';
import {
    unloadArrivingVehiclesBehavior,
    unloadArrivingVehiclesBehaviorStateSchema,
} from './unload-arrived-vehicles.js';
import { reportBehavior, reportBehaviorStateSchema } from './report.js';
import {
    automaticallyDistributeVehiclesBehavior,
    automaticallyDistributeVehiclesBehaviorStateSchema,
} from './automatically-distribute-vehicles.js';
import {
    providePersonnelBehavior,
    providePersonnelBehaviorStateSchema,
} from './provide-personnel.js';
import {
    answerRequestsBehavior,
    answerRequestsBehaviorStateSchema,
} from './answer-requests.js';
import { requestBehavior, requestBehaviorStateSchema } from './request.js';
import { transferBehavior, transferBehaviorStateSchema } from './transfer.js';
import {
    transferToHospitalBehavior,
    transferToHospitalBehaviorStateSchema,
} from './transfer-to-hospital.js';
import {
    managePatientTransportToHospitalBehavior,
    managePatientTransportToHospitalBehaviorStateSchema,
} from './manage-patient-transport-to-hospital.js';

export const exerciseSimulationBehaviorStateSchema = z.discriminatedUnion(
    'type',
    [
        automaticallyDistributeVehiclesBehaviorStateSchema,
        assignLeaderBehaviorStateSchema,
        treatPatientsBehaviorStateSchema,
        unloadArrivingVehiclesBehaviorStateSchema,
        reportBehaviorStateSchema,
        providePersonnelBehaviorStateSchema,
        answerRequestsBehaviorStateSchema,
        requestBehaviorStateSchema,
        transferBehaviorStateSchema,
        transferToHospitalBehaviorStateSchema,
        managePatientTransportToHospitalBehaviorStateSchema,
    ]
);

export type ExerciseSimulationBehaviorState = z.infer<
    typeof exerciseSimulationBehaviorStateSchema
>;

export type ExerciseSimulationBehaviorType =
    ExerciseSimulationBehaviorState['type'];

export const simulationBehaviorDictionary = {
    automaticallyDistributeVehiclesBehavior,
    assignLeaderBehavior,
    treatPatientsBehavior,
    unloadArrivingVehiclesBehavior,
    reportBehavior,
    providePersonnelBehavior,
    answerRequestsBehavior,
    requestBehavior,
    transferBehavior,
    transferToHospitalBehavior,
    managePatientTransportToHospitalBehavior,
} as const;
