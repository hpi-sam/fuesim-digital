import { z } from 'zod';

export const treatmentProgressAllowedValues = [
    'counted',
    'noTreatment',
    'secured',
    'triaged',
    'unknown',
] as const;

export const treatmentProgressSchema = z.literal(
    treatmentProgressAllowedValues
);
export type TreatmentProgress = z.infer<typeof treatmentProgressSchema>;

export const treatmentProgressToGermanNameDictionary: {
    [Key in TreatmentProgress]: string;
} = {
    counted: 'Vorsichten',
    noTreatment: 'Keine Behandlung',
    secured: 'Erstversorgung sichergestellt',
    triaged: 'Behandeln, Personal fehlt',
    unknown: 'Erkunden',
};
