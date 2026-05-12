import type { WritableDraft } from 'immer';
import { produce } from 'immer';
import { toLonLat } from 'ol/proj.js';
import { ExerciseState } from '../../state.js';
import { addPatient } from '../../../tests/utils/patients.spec.js';
import type { ParticipantKey } from '../../exercise-keys.js';
import type { Patient } from '../../models/patient.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { newMapCoordinatesAt } from '../../models/utils/position/map-coordinates.js';
import { coordinateStringToNumber } from '../../utils/string-coordinates.js';
import { newNoPosition } from '../../models/utils/position/no-position.js';
import { defaultViewportSize, newViewport } from '../../models/viewport.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';
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

const noPosition = newNoPosition();
const mapPosition = newMapPositionAt(
    newMapCoordinatesAt(1461702.742011243, 6871506.040852688)
);
const realPosition = toLonLat([
    mapPosition.coordinates.x,
    mapPosition.coordinates.y,
]);

describe('csv export', () => {
    describe.each([
        [
            'red patient',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    // patient is inside of viewport
                    const viewport = newViewport(
                        {
                            x: mapPosition.coordinates.x - 1,
                            y: mapPosition.coordinates.y + 1,
                        },
                        'Test Viewport'
                    );
                    draftState.viewports[viewport.id] = viewport;
                    const patient = addPatient(
                        draftState,
                        'red',
                        'red',
                        mapPosition
                    );
                    patient.biometricInformation.sex = 'female';
                },
                {
                    status: '1',
                    sex: 'W',
                    remarks: '',
                    hasTransportPriority: '0',
                    longitude: coordinateStringToNumber.encode(
                        realPosition[0]!
                    ),
                    latitude: coordinateStringToNumber.encode(realPosition[1]!),
                    section: 'Test Viewport',
                },
            ],
        ],
        [
            'yellow patient',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    // patient is outside of viewport
                    const viewport = newViewport(
                        {
                            x: mapPosition.coordinates.x + 1,
                            y: mapPosition.coordinates.y + 1,
                        },
                        'Test Viewport'
                    );
                    draftState.viewports[viewport.id] = viewport;
                    const patient = addPatient(
                        draftState,
                        'yellow',
                        'yellow',
                        mapPosition
                    );
                    patient.biometricInformation.sex = 'male';
                    patient.remarks = 'unique_remarks';
                },
                {
                    status: '2',
                    sex: 'M',
                    remarks: 'unique_remarks',
                    longitude: coordinateStringToNumber.encode(
                        realPosition[0]!
                    ),
                    latitude: coordinateStringToNumber.encode(realPosition[1]!),
                    section: '',
                },
            ],
        ],
        [
            'green patient',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    // patient is in both viewports, select smaller
                    const largerViewport = newViewport(
                        {
                            x: mapPosition.coordinates.x - 1,
                            y: mapPosition.coordinates.y + 1,
                        },
                        'large'
                    );
                    largerViewport.size = {
                        width: defaultViewportSize.width * 2,
                        height: defaultViewportSize.height * 2,
                    };
                    draftState.viewports[largerViewport.id] = largerViewport;

                    const smallerViewport = newViewport(
                        {
                            x: mapPosition.coordinates.x - 1,
                            y: mapPosition.coordinates.y + 1,
                        },
                        'small'
                    );
                    draftState.viewports[smallerViewport.id] = smallerViewport;

                    const patient = addPatient(
                        draftState,
                        'green',
                        'green',
                        mapPosition
                    );
                    patient.biometricInformation.sex = 'diverse';
                    patient.hasTransportPriority = true;
                },
                {
                    status: '3',
                    sex: '',
                    hasTransportPriority: '1',
                    section: 'small',
                },
            ],
        ],
        [
            'blue patient',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    const patient = addPatient(
                        draftState,
                        'blue',
                        'blue',
                        noPosition
                    );
                    patient.biometricInformation.sex = 'female';
                },
                {
                    status: '1',
                    longitude: '',
                    latitude: '',
                },
            ],
        ],
        [
            'black patient',
            [
                (draftState: WritableDraft<ExerciseState>) => {
                    const patient = addPatient(
                        draftState,
                        'black',
                        'black',
                        noPosition
                    );
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
                    const patient = addPatient(
                        draftState,
                        'white',
                        'red',
                        noPosition
                    );
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
                    const patient = addPatient(
                        draftState,
                        'red',
                        'yellow',
                        noPosition
                    );
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
            expect(exportedPatient.patientTray).toBe('');

            for (const key of TypeAssertedObject.keys(expectedState)) {
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
    it('at least one correct patient in CSV', () => {
        let patient: Patient;
        const state = setupState((draftState: WritableDraft<ExerciseState>) => {
            patient = addPatient(draftState, 'red', 'red');
            patient.identifier = 'xyz';
        });
        const csvContent = exportPatientsToCSV(state);
        expect(csvContent).toStartWith(patientsCsvExportColumns.join(';'));
        expect(csvContent).toInclude(patient!.identifier);
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
