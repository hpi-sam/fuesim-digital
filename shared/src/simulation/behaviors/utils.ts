import { newMaterialCountRadiogram } from '../../models/radiogram/material-count-radiogram.js';
import { newPatientCountRadiogram } from '../../models/radiogram/patient-count-radiogram.js';
import { newPersonnelCountRadiogram } from '../../models/radiogram/personnel-count-radiogram.js';
import { newResourceRequestRadiogram } from '../../models/radiogram/resource-request-radiogram.js';
import { newTransferCountsRadiogram } from '../../models/radiogram/transfer-counts-radiogram.js';
import { newTransferConnectionsRadiogram } from '../../models/radiogram/transfer-connections-radiogram.js';
import { newTreatmentStatusRadiogram } from '../../models/radiogram/treatment-status-radiogram.js';
import { newVehicleCountRadiogram } from '../../models/radiogram/vehicle-count-radiogram.js';
import { newVehicleOccupationsRadiogram } from '../../models/radiogram/vehicle-occupations-radiogram.js';

import type {
    ExerciseRadiogram,
    ExerciseRadiogramStatus,
} from '../../models/radiogram/index.js';
import type { UUID } from '../../utils/index.js';
import type { ExerciseSimulationBehaviorType } from './exercise-simulation-behavior.js';
import type { ReportableInformation } from './reportable-information.js';

export const createRadiogramMap: {
    [Key in ReportableInformation]: (
        id: UUID,
        simulatedRegionId: UUID,
        key: string | null,
        status: ExerciseRadiogramStatus
    ) => ExerciseRadiogram;
} = {
    materialCount: newMaterialCountRadiogram,
    patientCount: newPatientCountRadiogram,
    personnelCount: newPersonnelCountRadiogram,
    requiredResources: newResourceRequestRadiogram,
    singleRegionTransferCounts: newTransferCountsRadiogram,
    transferConnections: newTransferConnectionsRadiogram,
    transportManagementTransferCounts: newTransferCountsRadiogram,
    treatmentStatus: newTreatmentStatusRadiogram,
    vehicleCount: newVehicleCountRadiogram,
    vehicleOccupations: newVehicleOccupationsRadiogram,
};

export const behaviorTypeToGermanNameDictionary: {
    [Key in ExerciseSimulationBehaviorType]: string;
} = {
    assignLeaderBehavior: 'Führung zuweisen',
    treatPatientsBehavior: 'Patienten behandeln',
    unloadArrivingVehiclesBehavior: 'Fahrzeuge entladen',
    reportBehavior: 'Berichte erstellen',
    providePersonnelBehavior: 'Personal nachfordern',
    answerRequestsBehavior: 'Fahrzeuganfragen beantworten',
    automaticallyDistributeVehiclesBehavior: 'Fahrzeuge verteilen',
    requestBehavior: 'Fahrzeuge anfordern',
    transferBehavior: 'Fahrzeuge versenden',
    transferToHospitalBehavior: 'Patienten abtransportieren',
    managePatientTransportToHospitalBehavior: 'Transportorganisation',
};
