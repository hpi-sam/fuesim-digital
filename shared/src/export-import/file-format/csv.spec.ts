import type { WritableDraft } from 'immer';
import { produce } from 'immer';
import { ExerciseState } from '../../state.js';
import { addPatient } from '../../../tests/utils/patients.spec.js';
import type { Patient } from '../../models/index.js';
import type { ParticipantKey } from '../../exercise-keys.js';
import {
    exportPatientsToCSV,
    patientsCsvExportColumns,
    preparePatientsForCSVExport,
} from './csv.js';

const emptyState = ExerciseState.create('123456' as ParticipantKey);

function setupState(
    mutateBeforeState: (state: WritableDraft<ExerciseState>) => void
) {
    return produce(emptyState, (draftState) => {
        mutateBeforeState(draftState);
    });
}

describe('csv export', () => {
    describe.each([
        [
            'red patient',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    const patient = addPatient(draftState, 'red', 'red');
                    patient.biometricInformation.sex = 'female';
                },
                {
                    status: '1',
                    sex: 'W',
                    remarks: '',
                    hasTransportPriority: '0',
                },
            ],
        ],
        [
            'yellow patient',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    const patient = addPatient(draftState, 'yellow', 'yellow');
                    patient.biometricInformation.sex = 'male';
                    patient.remarks = 'unique_remarks';
                },
                {
                    status: '2',
                    sex: 'M',
                    remarks: 'unique_remarks',
                },
            ],
        ],
        [
            'green patient',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    const patient = addPatient(draftState, 'green', 'green');
                    patient.biometricInformation.sex = 'diverse';
                    patient.hasTransportPriority = true;
                },
                {
                    status: '3',
                    sex: '',
                    hasTransportPriority: '1',
                },
            ],
        ],
        [
            'blue patient',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    const patient = addPatient(draftState, 'blue', 'blue');
                    patient.biometricInformation.sex = 'female';
                },
                {
                    status: '1',
                },
            ],
        ],
        [
            'black patient',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    const patient = addPatient(draftState, 'black', 'black');
                    patient.biometricInformation.sex = 'female';
                },
                {
                    status: '1',
                },
            ],
        ],
        [
            'white patient',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    const patient = addPatient(draftState, 'white', 'red');
                    patient.biometricInformation.sex = 'female';
                },
                {
                    status: '1',
                },
            ],
        ],
        [
            'red triaged, but real yellow',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    const patient = addPatient(draftState, 'red', 'yellow');
                    patient.biometricInformation.sex = 'female';
                },
                {
                    status: '1',
                },
            ],
        ],
    ] as const)('export %s', (_, [mutateState, expectedState]) => {
        it('correct data', () => {
            const state = setupState(mutateState);
            const patient = Object.values(state.patients)[0]!;
            const patients = preparePatientsForCSVExport(state);
            expect(patients).toHaveLength(1);
            const exportedPatient = patients[0]!;
            expect(exportedPatient.id).toBe(patient.identifier);
            expect(exportedPatient.age).toBe(patient.biometricInformation.age);
            expect(exportedPatient.pzc).toBe('');
            expect(exportedPatient.ventilated).toBe('');
            expect(exportedPatient.doctorEscort).toBe('');

            for (const key of Object.keys(expectedState)) {
                // @ts-expect-error: string
                expect(exportedPatient[key]).toBe(expectedState[key]);
            }
        });
    });
    it('correct columns', () => {
        const state = setupState(() => {
            // no patients
        });
        const csvContent = exportPatientsToCSV(state);
        expect(csvContent).toBe(patientsCsvExportColumns.join(';'));
    });
    it('multiple patients', () => {
        let patients: Patient[] = [];
        const state = setupState((draftState: WritableDraft<ExerciseState>) => {
            patients = [
                addPatient(draftState, 'red', 'red'),
                addPatient(draftState, 'yellow', 'yellow'),
                addPatient(draftState, 'green', 'green'),
            ];
        });

        const exportedPatients = preparePatientsForCSVExport(state);
        expect(exportedPatients).toHaveLength(patients.length);
        expect(
            exportedPatients.map((patient) => patient.id)
        ).toIncludeAllMembers(patients.map((patient) => patient.identifier));
    });
});
