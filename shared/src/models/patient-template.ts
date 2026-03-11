import { z } from 'zod';
import type { UUID } from '../utils/index.js';
import { uuidSchema, cloneDeepMutable, uuid } from '../utils/index.js';
import type {
    BiometricInformation,
    HealthPoints,
    ImageProperties,
    PatientStatusCode,
    Position,
} from './utils/index.js';
import {
    imagePropertiesSchema,
    biometricInformationSchema,
    getStatus,
    healthPointsSchema,
} from './utils/index.js';
import { generatePersonalInformation } from './utils/personal-information.js';
import type { Patient } from './patient.js';
import { newPatient } from './patient.js';
import type {
    FunctionParameters,
    PatientHealthState,
} from './patient-health-state.js';
import { patientHealthStateSchema } from './patient-health-state.js';
import type { PretriageInformation } from './utils/pretriage-information.js';
import { pretriageInformationSchema } from './utils/pretriage-information.js';

export const patientTemplateSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('patientTemplate'),
    biometricInformation: biometricInformationSchema,
    pretriageInformation: pretriageInformationSchema,
    image: imagePropertiesSchema,
    healthStates: z.record(uuidSchema, patientHealthStateSchema),
    startingHealthStateId: uuidSchema,
    health: healthPointsSchema,
});
export type PatientTemplate = z.infer<typeof patientTemplateSchema>;

export function newPatientTemplate(
    biometricInformation: BiometricInformation,
    pretriageInformation: PretriageInformation,
    healthStates: { readonly [stateId: UUID]: PatientHealthState },
    image: ImageProperties,
    health: HealthPoints,
    startingHealthStateId: UUID
): PatientTemplate {
    return {
        id: uuid(),
        type: 'patientTemplate',
        biometricInformation,
        pretriageInformation,
        healthStates,
        image,
        health,
        startingHealthStateId,
    };
}

export function newPatientFromTemplate(
    template: PatientTemplate,
    patientStatusCode: PatientStatusCode,
    position: Position
): Patient {
    // Randomize function parameters
    const healthStates = Object.fromEntries(
        Object.entries(cloneDeepMutable(template.healthStates)).map(
            ([stateId, state]) => {
                const functionParameters = Object.fromEntries(
                    Object.entries(state.functionParameters).map(
                        ([key, value]) => [
                            key as keyof FunctionParameters,
                            randomizeValue(value, 0.2),
                        ]
                        // The signatures for Object.fromEntries and Object.entries are not made for literals...
                    ) as [keyof FunctionParameters, any][]
                ) as FunctionParameters;
                // The function parameters will randomize by 20%
                return [
                    stateId,
                    {
                        ...state,
                        functionParameters,
                    },
                ];
            }
        )
    );
    const status = getStatus(template.health);
    return newPatient(
        generatePersonalInformation(template.biometricInformation.sex),
        template.biometricInformation,
        template.pretriageInformation,
        patientStatusCode,
        'white',
        status,
        healthStates,
        template.startingHealthStateId,
        template.image,
        template.health,
        '',
        position
    );
}

function randomizeValue(value: number, randomizeBy: number): number {
    return value + value * (Math.random() - 0.5) * randomizeBy;
}
