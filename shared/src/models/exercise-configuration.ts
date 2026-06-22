import { z } from 'zod';
import type { Immutable } from 'immer';
import {
    defaultTileMapProperties,
    defaultOperationsMapProperties,
} from '../data/default-state/map-properties.js';
import {
    tileMapPropertiesSchema,
    operationsMapPropertiesSchema,
} from './utils/map-properties.js';

export const patientTicketModeSchema = z.literal([
    'none',
    'freeText',
    'external',
]);
export type PatientTicketMode = z.infer<typeof patientTicketModeSchema>;

export const elementHighlightingModeSchema = z.literal([
    'off',
    'trainersOnly',
    'all',
]);
export type ElementHighlightingMode = z.infer<
    typeof elementHighlightingModeSchema
>;

export const exerciseConfigurationSchema = z.strictObject({
    type: z.literal('exerciseConfiguration'),
    pretriageEnabled: z.boolean(),
    bluePatientsEnabled: z.boolean(),
    patientIdentifierPrefix: z.string(),
    patientTicketMode: patientTicketModeSchema,
    vehicleStatusHighlight: z.boolean(),
    vehicleStatusInPatientStatusColor: z.boolean(),
    vehicleLoadTimesEnabled: z.boolean(),
    highlightRelatedElements: elementHighlightingModeSchema,
    participantLoadAllEnabled: z.boolean(),
    tileMapProperties: tileMapPropertiesSchema,
    operationsMapProperties: operationsMapPropertiesSchema,
});
export type ExerciseConfiguration = Immutable<
    z.infer<typeof exerciseConfigurationSchema>
>;
export function newExerciseConfiguration(): ExerciseConfiguration {
    return {
        type: 'exerciseConfiguration',
        pretriageEnabled: true,
        bluePatientsEnabled: false,
        patientIdentifierPrefix: '',
        patientTicketMode: 'freeText',
        vehicleStatusHighlight: false,
        vehicleStatusInPatientStatusColor: false,
        vehicleLoadTimesEnabled: true,
        highlightRelatedElements: 'trainersOnly',
        participantLoadAllEnabled: true,
        tileMapProperties: defaultTileMapProperties,
        operationsMapProperties: defaultOperationsMapProperties,
    };
}
