import type { WritableDraft } from 'immer';
import { produce } from 'immer';
import { ExerciseState } from '../../../state.js';
import { addMaterial } from '../../../../tests/utils/materials.spec.js';
import { addPatient } from '../../../../tests/utils/patients.spec.js';
import { addPersonnel } from '../../../../tests/utils/personnel.spec.js';
import { assertCatering } from '../../../../tests/utils/catering.spec.js';
import { defaultPersonnelTemplates } from '../../../data/default-state/personnel-templates.js';
import { newCanCaterFor } from '../../../models/utils/cater-for.js';
import type { ParticipantKey } from '../../../exercise-keys.js';
import type { Position } from '../../../models/utils/position/position.js';
import { newPersonnelFromTemplate } from '../../../models/personnel.js';
import { newVehiclePositionIn } from '../../../models/utils/position/vehicle-position.js';
import { newMapPositionAt } from '../../../models/utils/position/map-position.js';
import type { PatientStatus } from '../../../models/utils/patient-status.js';
import { uuid } from '../../../utils/uuid.js';
import { updateTreatments } from './calculate-treatments.js';

const emptyState = ExerciseState.create('123456' as ParticipantKey);

function createNotSan(position: Position) {
    const template = defaultPersonnelTemplates.notSan;
    return newPersonnelFromTemplate(
        {
            ...template,
            canCaterFor: {
                red: 1,
                yellow: 0,
                green: 0,
                logicalOperator: 'and',
            },
        },
        uuid(),
        'RTW 3/83/1',
        position
    );
}

/**
 * Perform {@link mutateBeforeState} and then call `calculateTreatments`
 * @param mutateBeforeState A function that may be called on the default state before calling to `calculateTreatments`.
 * @returns The state before and after calling `calculateTreatments`
 */
function setupStateAndApplyTreatments(
    mutateBeforeState?: (state: WritableDraft<ExerciseState>) => void
) {
    const beforeState = produce(emptyState, (draftState) => {
        mutateBeforeState?.(draftState);
    });

    const newState = produce(beforeState, (draft) => {
        for (const patient of Object.values(draft.patients)) {
            updateTreatments(draft, patient);
        }
    });
    return {
        beforeState,
        newState,
    };
}

describe('calculate treatment', () => {
    it('does nothing when there is nothing', () => {
        const { beforeState, newState } = setupStateAndApplyTreatments();
        expect(newState).toStrictEqual(beforeState);
    });

    it('does nothing when there is only personnel in vehicle', () => {
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                addPersonnel(state, createNotSan(newVehiclePositionIn('')));
            }
        );
        expect(newState).toStrictEqual(beforeState);
    });

    it('does nothing when there is only personnel outside vehicle', () => {
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                addPersonnel(
                    state,
                    createNotSan(newMapPositionAt({ x: 0, y: 0 }))
                );
            }
        );
        expect(newState).toStrictEqual(beforeState);
    });

    it('does nothing when there is only material in vehicle', () => {
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                addMaterial(state, newVehiclePositionIn(''));
            }
        );
        expect(newState).toStrictEqual(beforeState);
    });

    it('does nothing when there is only material outside vehicle', () => {
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                addMaterial(state, newMapPositionAt({ x: 0, y: 0 }));
            }
        );
        expect(newState).toStrictEqual(beforeState);
    });

    it('does nothing when there are only non-dead patients', () => {
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                (['green', 'yellow', 'red'] as PatientStatus[]).forEach(
                    (color) => {
                        addPatient(
                            state,
                            color,
                            color,
                            newMapPositionAt({ x: 0, y: 0 })
                        );
                    }
                );
            }
        );
        expect(newState).toStrictEqual(beforeState);
    });

    it('does nothing when there are only dead patients', () => {
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                addPatient(
                    state,
                    'black',
                    'black',
                    newMapPositionAt({ x: 0, y: 0 })
                );
            }
        );
        expect(newState).toStrictEqual(beforeState);
    });

    it('does nothing when all personnel is in a vehicle', () => {
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                addPatient(
                    state,
                    'green',
                    'green',
                    newMapPositionAt({ x: 0, y: 0 })
                );
                addPersonnel(state, createNotSan(newVehiclePositionIn('')));
            }
        );
        expect(newState).toStrictEqual(beforeState);
    });

    it('does nothing when all material is in a vehicle', () => {
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                addPatient(
                    state,
                    'green',
                    'green',
                    newMapPositionAt({ x: 0, y: 0 })
                );
                addMaterial(state, newVehiclePositionIn(''));
            }
        );
        expect(newState).toStrictEqual(beforeState);
    });

    it('treats the nearest patient within the overrideTreatmentRange, regardless of status', () => {
        const ids = {
            material: '',
            greenPatient: '',
            redPatient: '',
        };
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                ids.greenPatient = addPatient(
                    state,
                    'green',
                    'green',
                    newMapPositionAt({ x: 0, y: 0 })
                ).id;
                ids.redPatient = addPatient(
                    state,
                    'red',
                    'red',
                    newMapPositionAt({ x: 2, y: 2 })
                ).id;
                ids.material = addMaterial(
                    state,
                    newMapPositionAt({ x: 0, y: 0 })
                ).id;
            }
        );
        assertCatering(beforeState, newState, [
            {
                catererId: ids.material,
                catererType: 'material',
                patientIds: [ids.greenPatient],
            },
        ]);
    });

    it('treats the patient with worse status within the treatmentRange, regardless of distance', () => {
        const ids = {
            material: '',
            greenPatient: '',
            redPatient: '',
        };
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                ids.greenPatient = addPatient(
                    state,
                    'green',
                    'green',
                    newMapPositionAt({ x: -3, y: -3 })
                ).id;
                ids.redPatient = addPatient(
                    state,
                    'red',
                    'red',
                    newMapPositionAt({ x: 3, y: 3 })
                ).id;
                ids.material = addMaterial(
                    state,
                    newMapPositionAt({ x: 0, y: 0 })
                ).id;
            }
        );
        assertCatering(beforeState, newState, [
            {
                catererId: ids.material,
                catererType: 'material',
                patientIds: [ids.redPatient],
            },
        ]);
    });

    it('treats no patients when all are out of reach', () => {
        const ids = {
            material: '',
            greenPatient: '',
            redPatient: '',
        };
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                ids.greenPatient = addPatient(
                    state,
                    'green',
                    'green',
                    newMapPositionAt({ x: -10, y: -10 })
                ).id;
                ids.redPatient = addPatient(
                    state,
                    'red',
                    'red',
                    newMapPositionAt({ x: 20, y: 20 })
                ).id;
                ids.material = addMaterial(
                    state,
                    newMapPositionAt({ x: 0, y: 0 })
                ).id;
            }
        );
        assertCatering(beforeState, newState, []);
    });

    it('treats multiple patients when there is capacity', () => {
        const ids = {
            material: '',
            greenPatient: '',
            redPatient: '',
        };
        const { beforeState, newState } = setupStateAndApplyTreatments(
            (state) => {
                ids.greenPatient = addPatient(
                    state,
                    'green',
                    'green',
                    newMapPositionAt({ x: -1, y: -1 })
                ).id;
                ids.redPatient = addPatient(
                    state,
                    'red',
                    'red',
                    newMapPositionAt({ x: 2, y: 2 })
                ).id;
                const material = addMaterial(
                    state,
                    newMapPositionAt({ x: 0, y: 0 })
                );
                material.canCaterFor = newCanCaterFor(1, 0, 1, 'and');
                ids.material = material.id;
            }
        );
        assertCatering(beforeState, newState, [
            {
                catererId: ids.material,
                catererType: 'material',
                patientIds: [ids.redPatient, ids.greenPatient],
            },
        ]);
    });
});
