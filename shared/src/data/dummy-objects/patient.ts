import {
    newMapPositionAt,
    FunctionParameters,
    Patient,
    PatientHealthState,
    PatientStatusCode,
} from '../../models/index.js';
import { defaultPatientCategories } from '../default-state/patient-templates.js';

export function generateDummyPatient(): Patient {
    const template = defaultPatientCategories[0]!.patientTemplates[0]!;
    const healthState = PatientHealthState.create(
        FunctionParameters.create(-10_000, 0, 0, 0),
        []
    );
    return Patient.create(
        {
            address: 'Musterstraße 1',
            name: 'John Doe',
            birthdate: '1.1.',
        },
        template.biometricInformation,
        template.pretriageInformation,
        PatientStatusCode.create('ZAZAZA'),
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
