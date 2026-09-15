import type { UUID } from '../utils/uuid.js';
import { defaultPatientCategories } from '../data/default-state/patient-templates.js';
import type { PatientStatusCode } from '../models/utils/patient-status-code.js';
import type { Migration } from './migration-functions.js';

interface Patient {
    pzc: number;
    patientStatusCode: PatientStatusCode;
    biometricInformation: {
        externalFeatures: string;
    };
}

interface PatientTemplate {
    pzc: number;
    biometricInformation: {
        externalFeatures: string;
    };
}

interface PatientCategory {
    name: PatientStatusCode;
    patientTemplates: PatientTemplate[];
}

type Action =
    | {
          type: '[Patient] Add patient';
          patient: Patient;
      }
    | { type: '[DUMMY]' };

function joinStatusCode(code: PatientStatusCode) {
    return `${code.firstField.colorCode}${code.firstField.behaviourCode}${code.secondField.colorCode}${code.secondField.behaviourCode}${code.thirdField.colorCode}${code.thirdField.behaviourCode}${code.tags.join()}`;
}

function findPzc(code: PatientStatusCode, externalFeatures: string) {
    const patientCategory = defaultPatientCategories.find(
        (category) => joinStatusCode(category.name) === joinStatusCode(code)
    );
    if (!patientCategory) return 0;
    const patientTemplate = patientCategory.patientTemplates.find(
        (template) =>
            template.biometricInformation.externalFeatures === externalFeatures
    );
    if (!patientTemplate) return 0;
    return patientTemplate.pzc;
}
function migratePatient(patient: Patient) {
    patient.pzc = findPzc(
        patient.patientStatusCode,
        patient.biometricInformation.externalFeatures
    );
}

export const patientsPzc64: Migration = {
    action: (_, action) => {
        const typedAction = action as Action;
        switch (typedAction.type) {
            case '[Patient] Add patient':
                migratePatient(typedAction.patient);
                break;
            default:
                break;
        }

        return true;
    },
    state: (state) => {
        const typedState = state as {
            patients: {
                [key: UUID]: Patient;
            };
            hospitalPatients: {
                [key: UUID]: Patient;
            };
            patientCategories: PatientCategory[];
        };

        for (const patientCategory of typedState.patientCategories) {
            for (const patientTemplate of patientCategory.patientTemplates) {
                patientTemplate.pzc = findPzc(
                    patientCategory.name,
                    patientTemplate.biometricInformation.externalFeatures
                );
            }
        }

        Object.values(typedState.patients).forEach(migratePatient);
        Object.values(typedState.hospitalPatients).forEach(migratePatient);
    },
};
