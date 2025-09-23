import {
    ResourceRequestRadiogram,
    TransferConnectionsRadiogram,
    TransferCountsRadiogram,
    VehicleOccupationsRadiogram,
} from '../../models/radiogram/index.js';
import type { ExerciseRadiogram } from '../../models/radiogram/exercise-radiogram.js';
import { MaterialCountRadiogram } from '../../models/radiogram/material-count-radiogram.js';
import { PatientCountRadiogram } from '../../models/radiogram/patient-count-radiogram.js';
import { PersonnelCountRadiogram } from '../../models/radiogram/personnel-count-radiogram.js';
import type { ExerciseRadiogramStatus } from '../../models/radiogram/status/exercise-radiogram-status.js';
import { TreatmentStatusRadiogram } from '../../models/radiogram/treatment-status-radiogram.js';
import { VehicleCountRadiogram } from '../../models/radiogram/vehicle-count-radiogram.js';
import type { UUID } from '../../utils/index.js';
import { StrictObject } from '../../utils/index.js';
import type { AllowedValues } from '../../utils/validators/index.js';
import type { ExerciseSimulationBehaviorType } from './exercise-simulation-behavior.js';

export const reportableInformationAllowedValues: AllowedValues<ReportableInformation> =
    {
        materialCount: true,
        patientCount: true,
        personnelCount: true,
        requiredResources: true,
        singleRegionTransferCounts: true,
        transferConnections: true,
        transportManagementTransferCounts: true,
        treatmentStatus: true,
        vehicleCount: true,
        vehicleOccupations: true,
    };

export const reportableInformations = StrictObject.keys(
    reportableInformationAllowedValues
);

export type ReportableInformation =
    | 'materialCount'
    | 'patientCount'
    | 'personnelCount'
    | 'requiredResources'
    | 'singleRegionTransferCounts'
    | 'transferConnections'
    | 'transportManagementTransferCounts'
    | 'treatmentStatus'
    | 'vehicleCount'
    | 'vehicleOccupations';

export const createRadiogramMap: {
    [Key in ReportableInformation]: (
        id: UUID,
        simulatedRegionId: UUID,
        key: string | null,
        status: ExerciseRadiogramStatus
    ) => ExerciseRadiogram;
} = {
    materialCount: MaterialCountRadiogram.create,
    patientCount: PatientCountRadiogram.create,
    personnelCount: PersonnelCountRadiogram.create,
    requiredResources: ResourceRequestRadiogram.create,
    singleRegionTransferCounts: TransferCountsRadiogram.create,
    transferConnections: TransferConnectionsRadiogram.create,
    transportManagementTransferCounts: TransferCountsRadiogram.create,
    treatmentStatus: TreatmentStatusRadiogram.create,
    vehicleCount: VehicleCountRadiogram.create,
    vehicleOccupations: VehicleOccupationsRadiogram.create,
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

export const reportableInformationTypeToGermanNameDictionary: {
    [Key in ReportableInformation]: string;
} = {
    materialCount: 'Anzahl an Material',
    patientCount: 'Anzahl an Patienten',
    personnelCount: 'Anzahl an Rettungskräften',
    requiredResources: 'Aktuell benötigte Fahrzeuge',
    singleRegionTransferCounts:
        'Anzahl aus diesem Bereich in Krankenhäuser abtransportierter Patienten',
    transferConnections: 'Transferverbindungen',
    transportManagementTransferCounts:
        'Anzahl unter dieser Transportorganisation in Krankenhäuser abtransportierter Patienten',
    treatmentStatus: 'Behandlungsstatus',
    vehicleCount: 'Anzahl an Fahrzeugen',
    vehicleOccupations: 'Nutzung der Fahrzeuge',
};
