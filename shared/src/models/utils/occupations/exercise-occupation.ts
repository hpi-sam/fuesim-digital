import { z } from 'zod';
import { intermediateOccupationSchema } from './intermediate-occupation.js';
import { noOccupationSchema } from './no-occupation.js';
import { loadOccupationSchema } from './load-occupation.js';
import { waitForTransferOccupationSchema } from './wait-for-transfer-occupation.js';
import { unloadingOccupationSchema } from './unloading-occupation.js';
import { patientTransferOccupation } from './patient-transfer-occupation.js';

export const exerciseOccupationSchema = z.union([
    intermediateOccupationSchema,
    noOccupationSchema,
    loadOccupationSchema,
    waitForTransferOccupationSchema,
    unloadingOccupationSchema,
    patientTransferOccupation,
]);

export type ExerciseOccupation = z.infer<typeof exerciseOccupationSchema>;

export type ExerciseOccupationType = ExerciseOccupation['type'];

export const occupationToGermanDictionary: {
    [key in ExerciseOccupationType]: string;
} = {
    noOccupation: 'Nicht genutzt',
    intermediateOccupation: 'Wird übergeben',
    unloadingOccupation: 'Wird ausgeladen',
    loadOccupation: 'Wird beladen',
    waitForTransferOccupation: 'Wartet auf Transfer',
    patientTransferOccupation:
        'Wird einen Patienten zum Krankenhaus transportieren',
};
