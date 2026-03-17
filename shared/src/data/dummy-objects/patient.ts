import type { Patient } from '../../models/index.js';
import {
    newMapPositionAt,
    newPatientHealthState,
    newFunctionParameters,
    newPatientStatusCode,
} from '../../models/index.js';
import { defaultPatientCategories } from '../default-state/patient-templates.js';
import { newPatient } from '../../models/patient.js';

export function generateDummyPatient(): Patient {
    const template = defaultPatientCategories[0]!.patientTemplates[0]!;
    const healthState = newPatientHealthState(
        newFunctionParameters(-10_000, 0, 0, 0),
        []
    );
    return newPatient(
        {
            address: 'Musterstraße 1',
            name: 'John Doe',
            birthdate: '1.1.',
        },
        template.biometricInformation,
        template.pretriageInformation,
        newPatientStatusCode('ZAZAZA'),
        'green',
        'green',
        { [healthState.id]: healthState },
        healthState.id,
        template.image,
        template.health,
        '',
        newMapPositionAt({ x: 0, y: 0 })
    );
}
