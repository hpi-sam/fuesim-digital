import { z } from 'zod';

/**
 * A letter that defines the color of a patient in a patient status.
 * * `V`: ex (black)
 * * `W`: SK IV (blue)
 * * `X`: SK III (green)
 * * `Y`: SK II (yellow)
 * * `Z`: SK I (red)
 */
const colorCodeAllowedValues = ['V', 'W', 'X', 'Y', 'Z'] as const;
export const colorCodeSchema = z.literal(colorCodeAllowedValues);
export type ColorCode = z.infer<typeof colorCodeSchema>;

/**
 * A letter that defines how a patients changes
 * * `A`: stable
 * * `B`: treatment required
 * * `C`: transport priority
 * * `D`: complication
 * * `E`: dead
 */
const behaviourCodeAllowedValues = ['A', 'B', 'C', 'D', 'E'] as const;
export const behaviourCodeSchema = z.literal(behaviourCodeAllowedValues);
export type BehaviourCode = z.infer<typeof behaviourCodeSchema>;

const patientTagAllowedValues = ['P'] as const;
export const patientTagSchema = z.literal(patientTagAllowedValues);
export type PatientTag = z.infer<typeof patientTagSchema>;

export const patientStatusDataFieldSchema = z.strictObject({
    colorCode: colorCodeSchema,
    behaviourCode: behaviourCodeSchema,
});
export type PatientStatusDataField = z.infer<
    typeof patientStatusDataFieldSchema
>;

export function newPatientStatusDataField(
    colorCode: ColorCode,
    behaviourCode: BehaviourCode
): PatientStatusDataField {
    return { colorCode, behaviourCode };
}

export const patientStatusCodeSchema = z.strictObject({
    firstField: patientStatusDataFieldSchema,
    secondField: patientStatusDataFieldSchema,
    thirdField: patientStatusDataFieldSchema,
    tags: z.array(patientTagSchema),
});
export type PatientStatusCode = z.infer<typeof patientStatusCodeSchema>;

export function newPatientStatusCode(code: string) {
    return {
        firstField: newPatientStatusDataField(
            code[0]! as ColorCode,
            code[1]! as BehaviourCode
        ),
        secondField: newPatientStatusDataField(
            code[2]! as ColorCode,
            code[3]! as BehaviourCode
        ),
        thirdField: newPatientStatusDataField(
            code[4]! as ColorCode,
            code[5]! as BehaviourCode
        ),
        tags: [...code.slice(6)] as PatientTag[],
    };
}
