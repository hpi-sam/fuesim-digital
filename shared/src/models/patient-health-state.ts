import { z } from 'zod';
import { uuid, uuidSchema } from '../utils/index.js';
import { healthPointsSchema } from './utils/index.js';

/**
 * These parameters determine the increase or decrease of a patients health every second
 */
export const functionParametersSchema = z.strictObject({
    /**
     * Every second the health points are increased by this value
     */
    constantChange: z.number(),
    /**
     * Every second the health points are increased by this value multiplied by the weighted number of notarzt personnel
     */
    notarztModifier: z.number(),
    /**
     * Every second the health points are increased by this value multiplied by the weighted number of notSan personnel
     */
    notSanModifier: z.number(),
    /**
     * Every second the health points are increased by this value multiplied by the weighted number of rettSan personnel
     */
    rettSanModifier: z.number(),
    // TODO: sanModifier not included
});
export type FunctionParameters = z.infer<typeof functionParametersSchema>;

export function newFunctionParameters(
    constantChange: number,
    notarztModifier: number,
    notSanModifier: number,
    rettSanModifier: number
): FunctionParameters {
    return {
        constantChange,
        notarztModifier,
        notSanModifier,
        rettSanModifier,
    };
}
/**
 * If all conditions apply the patient should switch to the next state
 * if a condition is undefined it is ignored
 */
export const conditionParametersSchema = z.strictObject({
    /**
     * How long the patient is in the current state already
     */
    earliestTime: z.number().optional(),
    latestTime: z.number().optional(),
    minimumHealth: healthPointsSchema.optional(),
    maximumHealth: healthPointsSchema.optional(),
    isBeingTreated: z.boolean().optional(),
    /**
     * The id of the patients healthState to switch to when all the conditions match
     */
    matchingHealthStateId: uuidSchema,
});
export type ConditionParameters = z.infer<typeof conditionParametersSchema>;

export const patientHealthStateSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('patientHealthState'),
    functionParameters: functionParametersSchema,
    /**
     * The first matching conditions are selected.
     * When nothing matches, the state is not changed.
     */
    nextStateConditions: z.array(conditionParametersSchema),
});
export type PatientHealthState = z.infer<typeof patientHealthStateSchema>;

export function newPatientHealthState(
    functionParameters: FunctionParameters,
    nextStateConditions: ConditionParameters[]
): PatientHealthState {
    return {
        id: uuid(),
        type: 'patientHealthState',
        functionParameters,
        nextStateConditions,
    };
}
