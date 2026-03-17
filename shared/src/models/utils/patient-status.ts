import { z } from 'zod';

export const patientStatusAllowedValues = [
    'black',
    'blue',
    'green',
    'red',
    'white',
    'yellow',
] as const;
export const patientStatusSchema = z.literal(patientStatusAllowedValues);
export type PatientStatus = z.infer<typeof patientStatusSchema>;

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
export type PatientStatusForTransport = z.infer<
    typeof patientStatusForTransportSchema
>;
