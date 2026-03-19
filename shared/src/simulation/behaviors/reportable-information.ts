import { z } from 'zod';

export const reportableInformationAllowedValues = [
    'materialCount',
    'patientCount',
    'personnelCount',
    'requiredResources',
    'singleRegionTransferCounts',
    'transferConnections',
    'transportManagementTransferCounts',
    'treatmentStatus',
    'vehicleCount',
    'vehicleOccupations',
] as const;

export const reportableInformationSchema = z.literal(
    reportableInformationAllowedValues
);
export type ReportableInformation = z.infer<typeof reportableInformationSchema>;

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
