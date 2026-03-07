import { z } from 'zod';
import { defaultTileMapProperties } from '../data/index.js';
import { tileMapPropertiesSchema } from './utils/index.js';

export const exerciseConfigurationSchema = z.strictObject({
    pretriageEnabled: z.boolean(),
    bluePatientsEnabled: z.boolean(),
    patientIdentifierPrefix: z.string(),
    vehicleStatusHighlight: z.boolean(),
    vehicleStatusInPatientStatusColor: z.boolean(),
    tileMapProperties: tileMapPropertiesSchema,
});
export type ExerciseConfiguration = z.infer<typeof exerciseConfigurationSchema>;
export function newExerciseConfiguration(): ExerciseConfiguration {
    return {
        pretriageEnabled: true,
        bluePatientsEnabled: false,
        patientIdentifierPrefix: '',
        vehicleStatusHighlight: false,
        vehicleStatusInPatientStatusColor: false,
        tileMapProperties: defaultTileMapProperties,
    };
}
