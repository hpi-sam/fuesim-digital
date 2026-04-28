import type { Migration } from './migration-functions.js';

export const renameIncorrectPatientImages12: Migration = {
    action: (_intermediaryState, action) => {
        if ((action as { type: string }).type === '[Patient] Add patient') {
            migrateImageProperties(
                (action as { patient: { image: { url: string } } }).patient
                    .image
            );
        }
        return true;
    },
    state: (state) => {
        (
            state as {
                patientCategories: {
                    patientTemplates: { image: { url: string } }[];
                }[];
            }
        ).patientCategories.forEach((patientCategory) =>
            patientCategory.patientTemplates.forEach((patientTemplate) => {
                migrateImageProperties(patientTemplate.image);
            })
        );
        Object.values(
            (
                state as {
                    patients: {
                        readonly [key: string]: { image: { url: string } };
                    };
                }
            ).patients
        ).forEach((patient) => migrateImageProperties(patient.image));
    },
};

function migrateImageProperties(image: { url: string }) {
    if (image.url === '/assets/male-patient.svg') {
        image.url = '/assets/patient.svg';
    }
}
