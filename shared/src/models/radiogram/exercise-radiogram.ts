import { z } from 'zod';
import { materialCountRadiogramSchema } from './material-count-radiogram.js';
import { missingTransferConnectionRadiogramSchema } from './missing-transfer-connection-radiogram.js';
import { patientCountRadiogramSchema } from './patient-count-radiogram.js';
import { personnelCountRadiogramSchema } from './personnel-count-radiogram.js';
import { treatmentStatusRadiogramSchema } from './treatment-status-radiogram.js';
import { vehicleCountRadiogramSchema } from './vehicle-count-radiogram.js';
import { resourceRequestRadiogramSchema } from './resource-request-radiogram.js';
import { transferCountsRadiogramSchema } from './transfer-counts-radiogram.js';
import { transferCategoryCompletedRadiogramSchema } from './transfer-category-completed-radiogram.js';
import { newPatientDataRequestedRadiogramSchema } from './new-patient-data-requested-radiogram.js';
import { transferConnectionsRadiogramSchema } from './transfer-connections-radiogram.js';
import { vehicleOccupationsRadiogramSchema } from './vehicle-occupations-radiogram.js';

export const exerciseRadiogramSchema = z.discriminatedUnion('type', [
    materialCountRadiogramSchema,
    missingTransferConnectionRadiogramSchema,
    patientCountRadiogramSchema,
    personnelCountRadiogramSchema,
    personnelCountRadiogramSchema,
    resourceRequestRadiogramSchema,
    transferCategoryCompletedRadiogramSchema,
    transferConnectionsRadiogramSchema,
    transferCountsRadiogramSchema,
    treatmentStatusRadiogramSchema,
    vehicleCountRadiogramSchema,
    vehicleOccupationsRadiogramSchema,
    newPatientDataRequestedRadiogramSchema,
]);
export type ExerciseRadiogram = z.infer<typeof exerciseRadiogramSchema>;

export const radiogramTypeToGermanDictionary: {
    [Key in ExerciseRadiogram['type']]: string;
} = {
    materialCountRadiogram: 'Vorhandene Materialien',
    missingTransferConnectionRadiogram: 'Fehlende Verbindung',
    patientCountRadiogram: 'Meldung über Patientenanzahlen',
    personnelCountRadiogram: 'Personalstatus',
    resourceRequestRadiogram: 'Anfrage von Ressourcen',
    transferCategoryCompletedRadiogram: 'Transport für SK abgeschlossen',
    transferConnectionsRadiogram: 'Transferverbindungen',
    transferCountsRadiogram: 'Transportstatus',
    treatmentStatusRadiogram: 'Behandlungsphase',
    vehicleCountRadiogram: 'Meldung über Fahrzeuganzahlen',
    vehicleOccupationsRadiogram: 'Meldung über Fahrzeugnutzung',
    newPatientDataRequestedRadiogram: 'Anfrage nach Patientenzahlen',
};
