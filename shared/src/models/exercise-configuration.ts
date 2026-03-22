import { z } from 'zod';
import {
    defaultTileMapProperties,
    defaultOperationsMapProperties,
} from '../data/default-state/tile-map-properties.js';
import {
    tileMapPropertiesSchema,
    operationsMapPropertiesSchema,
} from './utils/tile-map-properties.js';

export const exerciseConfigurationSchema = z.strictObject({
    type: z.literal('exerciseConfiguration'),
    pretriageEnabled: z.boolean(),
    bluePatientsEnabled: z.boolean(),
    patientIdentifierPrefix: z.string(),
    vehicleStatusHighlight: z.boolean(),
    vehicleStatusInPatientStatusColor: z.boolean(),
    tileMapProperties: tileMapPropertiesSchema,
    operationsMapProperties: operationsMapPropertiesSchema,
});
export type ExerciseConfiguration = z.infer<typeof exerciseConfigurationSchema>;
export function newExerciseConfiguration(): ExerciseConfiguration {
    return {
        type: 'exerciseConfiguration',
        pretriageEnabled: true,
        bluePatientsEnabled: false,
        patientIdentifierPrefix: '',
        vehicleStatusHighlight: false,
        vehicleStatusInPatientStatusColor: false,
        tileMapProperties: defaultTileMapProperties,
        operationsMapProperties: defaultOperationsMapProperties,
    };
}
