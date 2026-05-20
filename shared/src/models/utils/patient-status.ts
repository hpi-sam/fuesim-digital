import { z } from 'zod';
import type { Immutable } from 'immer';

export const patientStatusAllowedValues = [
    'black',
    'blue',
    'green',
    'red',
    'white',
    'yellow',
] as const;
export const patientStatusSchema = z.literal(patientStatusAllowedValues);
export type PatientStatus = Immutable<z.infer<typeof patientStatusSchema>>;

export const statusNames: {
    [key in PatientStatus]: string;
} = {
    black: 'ex',
    blue: 'SK IV',
    green: 'SK III',
    red: 'SK I',
    white: 'Ungesichtet',
    yellow: 'SK II',
} as const;

export const patientStatusForTransportAllowedValues = [
    'green',
    'red',
    'yellow',
] as const;
export const patientStatusForTransportSchema = z.literal(
    patientStatusForTransportAllowedValues
);
export type PatientStatusForTransport = Immutable<
    z.infer<typeof patientStatusForTransportSchema>
>;
