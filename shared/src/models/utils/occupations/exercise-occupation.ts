import * as z from 'zod';
import {
    noOccupationSchema,
    intermediateOccupationSchema,
    loadOccupationSchema,
    waitForTransferOccupationSchema,
    unloadingOccupationSchema,
    patientTransferOccupation,
} from './index.js';

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
