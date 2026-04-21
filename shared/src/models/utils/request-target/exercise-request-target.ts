import { z } from 'zod';
import {
    simulatedRegionRequestTarget,
    simulatedRegionRequestTargetConfigurationSchema,
} from './simulated-region.js';
import {
    traineesRequestTarget,
    traineesRequestTargetConfigurationSchema,
} from './trainees.js';

export const requestTargets = {
    simulatedRegionRequestTarget,
    traineesRequestTarget,
};

export const exerciseRequestTargetConfigurationSchema = z.discriminatedUnion(
    'type',
    [
        simulatedRegionRequestTargetConfigurationSchema,
        traineesRequestTargetConfigurationSchema,
    ]
);

export type ExerciseRequestTarget =
    (typeof requestTargets)[keyof typeof requestTargets];

type ExerciseRequestTargetDictionary = {
    [Target in ExerciseRequestTarget as z.infer<
        Target['configurationSchema']
    >['type']]: Target;
};

export type ExerciseRequestTargetConfiguration = z.infer<
    typeof exerciseRequestTargetConfigurationSchema
>;

export const requestTargetDictionary = Object.fromEntries(
    Object.values(requestTargets).map((target) => [target.type, target])
) as ExerciseRequestTargetDictionary;
