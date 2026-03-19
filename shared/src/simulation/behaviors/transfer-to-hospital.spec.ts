import type { WritableDraft } from 'immer';
import { produce } from 'immer';
import type { Patient, SimulatedRegion } from '../../models/index.js';
import {
    newSimulatedRegion,
    newTransferPoint,
    newPatientTransferOccupation,
    newImageProperties,
    newWaitForTransferOccupation,
    newUnloadingOccupation,
    newLoadOccupation,
    newIntermediateOccupation,
    newNoOccupation,
    newMapCoordinatesAt,
    newSimulatedRegionPositionIn,
    newSize,
} from '../../models/index.js';
import { ExerciseState } from '../../state.js';
import type { UUIDSet } from '../../utils/index.js';
import { cloneDeepMutable, uuid } from '../../utils/index.js';
import { handleSimulationEvents } from '../utils/simulation.js';
import type { PatientCategoryTransferToHospitalFinishedEvent } from '../events/index.js';
import { newTickEvent, newVehicleArrivedEvent } from '../events/index.js';
import { addPatient } from '../../../tests/utils/patients.spec.js';
import type {
    DelayEventActivityState,
    TransferPatientToHospitalActivityState,
} from '../activities/index.js';
import { newVehicle } from '../../models/vehicle.js';
import type { ParticipantKey } from '../../exercise-keys.js';
import type { TransferToHospitalBehaviorState } from './transfer-to-hospital.js';
import { newTransferToHospitalBehaviorState } from './transfer-to-hospital.js';

const emptyState = ExerciseState.create('123456' as ParticipantKey);
const currentTime = 10_000;

function setupStateAndInteract(
    mutateBeforeState?: (
        state: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<TransferToHospitalBehaviorState>
    ) => void
) {
    const simulatedRegion = newSimulatedRegion(
        newMapCoordinatesAt(0, 0),
        newSize(10, 10),
        'test region'
    );
    const transferPoint = newTransferPoint(
        newSimulatedRegionPositionIn(simulatedRegion.id),
        '',
        `[Simuliert] test region`
    );

    const behavior = newTransferToHospitalBehaviorState();
    const beforeState = produce(emptyState, (draftState) => {
        draftState.simulatedRegions[simulatedRegion.id] =
            cloneDeepMutable(simulatedRegion);
        draftState.simulatedRegions[simulatedRegion.id]?.behaviors.push(
            cloneDeepMutable(behavior)
        );
        draftState.transferPoints[transferPoint.id] =
            cloneDeepMutable(transferPoint);

        draftState.currentTime = currentTime;

        const mutableSimulatedRegion =
            draftState.simulatedRegions[simulatedRegion.id]!;
        const behaviorState = mutableSimulatedRegion
            .behaviors[0] as WritableDraft<TransferToHospitalBehaviorState>;

        mutateBeforeState?.(draftState, mutableSimulatedRegion, behaviorState);
    });

    const afterState = produce(beforeState, (draftState) => {
        const mutableSimulatedRegion =
            draftState.simulatedRegions[simulatedRegion.id]!;
        handleSimulationEvents(draftState, mutableSimulatedRegion);
    });

    const beforeSimulatedRegion =
        beforeState.simulatedRegions[simulatedRegion.id]!;
    const afterSimulatedRegion =
        afterState.simulatedRegions[simulatedRegion.id]!;
    const beforeBehaviorState = beforeSimulatedRegion
        .behaviors[0] as TransferToHospitalBehaviorState;
    const afterBehaviorState = afterSimulatedRegion
        .behaviors[0] as TransferToHospitalBehaviorState;
    return {
        beforeState,
        afterState,
        beforeSimulatedRegion,
        afterSimulatedRegion,
        beforeBehaviorState,
        afterBehaviorState,
    };
}

function removeEvents(state: ExerciseState) {
    const newState = cloneDeepMutable(state);

    Object.values(newState.simulatedRegions).forEach((simulatedRegion) => {
        simulatedRegion.inEvents = [];
    });

    return newState;
}

describe('transfer to hospital behavior', () => {
    describe('on arriving vehicle', () => {
        describe.each([
            ['no', newNoOccupation()],
            [
                'valid intermediate',
                newIntermediateOccupation(currentTime + 1_000),
            ],
            [
                'expired intermediate',
                newIntermediateOccupation(currentTime - 1_000),
            ],
            ['load', newLoadOccupation(uuid())],
            ['unload', newUnloadingOccupation()],
            ['wait for transfer', newWaitForTransferOccupation()],
        ] as const)('with %s occupation', (_, occupation) => {
            it('does nothing', () => {
                const { beforeState, afterState } = setupStateAndInteract(
                    (state, simulatedRegion) => {
                        const vehicle = newVehicle(
                            'RTW',
                            'RTW',
                            uuid(),
                            {},
                            0,
                            newImageProperties('', 0, 0),
                            newSimulatedRegionPositionIn(simulatedRegion.id),
                            occupation
                        );
                        state.vehicles[vehicle.id] = vehicle;

                        simulatedRegion.inEvents.push(
                            cloneDeepMutable(
                                newVehicleArrivedEvent(
                                    vehicle.id,
                                    state.currentTime
                                )
                            )
                        );
                    }
                );

                const expectedState = removeEvents(beforeState);

                expect(afterState).toStrictEqual(expectedState);
            });
        });

        describe('with patient transfer occupation', () => {
            const vehicle = newVehicle(
                'RTW',
                'RTW',
                uuid(),
                {},
                10,
                newImageProperties('', 0, 0),
                newSimulatedRegionPositionIn(uuid()),
                newPatientTransferOccupation(uuid())
            );

            it('does nothing if there are no patients', () => {
                const { beforeState, afterState } = setupStateAndInteract(
                    (state, simulatedRegion) => {
                        const mutableVehicle = cloneDeepMutable(vehicle);
                        state.vehicles[mutableVehicle.id] = mutableVehicle;

                        simulatedRegion.inEvents.push(
                            cloneDeepMutable(
                                newVehicleArrivedEvent(
                                    mutableVehicle.id,
                                    state.currentTime
                                )
                            )
                        );
                    }
                );

                const expectedState = removeEvents(beforeState);

                expect(afterState).toStrictEqual(expectedState);
            });

            it('does nothing if there are no patients left', () => {
                const { beforeState, afterState } = setupStateAndInteract(
                    (state, simulatedRegion, behaviorState) => {
                        const mutableVehicle = cloneDeepMutable(vehicle);
                        state.vehicles[mutableVehicle.id] = mutableVehicle;

                        for (let i = 0; i < 5; i++) {
                            addPatient(
                                state,
                                'red',
                                'red',
                                newSimulatedRegionPositionIn(simulatedRegion.id)
                            );
                        }

                        Object.values(state.patients).forEach((patient) => {
                            behaviorState.patientIdsSelectedForTransfer[
                                patient.id
                            ] = true;
                        });

                        simulatedRegion.inEvents.push(
                            cloneDeepMutable(
                                newVehicleArrivedEvent(
                                    mutableVehicle.id,
                                    state.currentTime
                                )
                            )
                        );
                    }
                );

                const expectedState = removeEvents(beforeState);

                expect(afterState).toStrictEqual(expectedState);
            });

            it('does nothing if the vehicle has no capacity', () => {
                const { beforeState, afterState } = setupStateAndInteract(
                    (state, simulatedRegion) => {
                        const mutableVehicle = cloneDeepMutable(vehicle);
                        mutableVehicle.patientCapacity = 0;
                        state.vehicles[mutableVehicle.id] = mutableVehicle;

                        for (let i = 0; i < 5; i++) {
                            addPatient(
                                state,
                                'red',
                                'red',
                                newSimulatedRegionPositionIn(simulatedRegion.id)
                            );
                        }

                        simulatedRegion.inEvents.push(
                            cloneDeepMutable(
                                newVehicleArrivedEvent(
                                    mutableVehicle.id,
                                    state.currentTime
                                )
                            )
                        );
                    }
                );

                const expectedState = removeEvents(beforeState);

                expect(afterState).toStrictEqual(expectedState);
            });

            it('selects the most urgent patient', () => {
                let redPatient: WritableDraft<Patient>;

                const {
                    afterState,
                    beforeSimulatedRegion,
                    afterBehaviorState,
                } = setupStateAndInteract((state, simulatedRegion) => {
                    const mutableVehicle = cloneDeepMutable(vehicle);
                    mutableVehicle.patientCapacity = 1;
                    state.vehicles[mutableVehicle.id] = mutableVehicle;

                    redPatient = addPatient(
                        state,
                        'red',
                        'red',
                        newSimulatedRegionPositionIn(simulatedRegion.id)
                    );
                    addPatient(
                        state,
                        'yellow',
                        'yellow',
                        newSimulatedRegionPositionIn(simulatedRegion.id)
                    );
                    addPatient(
                        state,
                        'green',
                        'green',
                        newSimulatedRegionPositionIn(simulatedRegion.id)
                    );

                    simulatedRegion.inEvents.push(
                        cloneDeepMutable(
                            newVehicleArrivedEvent(
                                mutableVehicle.id,
                                state.currentTime
                            )
                        )
                    );
                });

                const activity = Object.values(
                    afterState.simulatedRegions[beforeSimulatedRegion.id]!
                        .activities
                )[0] as TransferPatientToHospitalActivityState;

                const patientUUIDSet = {
                    [redPatient!.id]: true,
                };

                expect(activity).toBeDefined();
                expect(activity.type).toBe('transferPatientToHospitalActivity');
                expect(activity.patientIds).toStrictEqual(patientUUIDSet);

                expect(
                    afterBehaviorState.patientIdsSelectedForTransfer
                ).toStrictEqual(patientUUIDSet);
            });

            it('selects patient with lowest uuid on same urgency', () => {
                const smallestUUID = '10942238-9741-4e06-bf3f-f9cd8710c8bd';
                const uuids = [
                    'cdb877ec-9f77-45c5-8b10-606d6f98f466',
                    '4080f366-5797-4bdd-bfa4-820bf4c3536c',
                    smallestUUID,
                    '1a1e66a3-4535-414e-93de-1d6a012f5511',
                    'd8ce7654-81a5-4070-b71f-0953afc67ea1',
                ];

                const {
                    afterState,
                    beforeSimulatedRegion,
                    afterBehaviorState,
                } = setupStateAndInteract((state, simulatedRegion) => {
                    const mutableVehicle = cloneDeepMutable(vehicle);
                    mutableVehicle.patientCapacity = 1;
                    state.vehicles[mutableVehicle.id] = mutableVehicle;

                    for (let i = 0; i < 5; i++) {
                        addPatient(
                            state,
                            'red',
                            'red',
                            newSimulatedRegionPositionIn(simulatedRegion.id),
                            uuids[i]
                        );
                    }

                    simulatedRegion.inEvents.push(
                        cloneDeepMutable(
                            newVehicleArrivedEvent(
                                mutableVehicle.id,
                                state.currentTime
                            )
                        )
                    );
                });

                const activity = Object.values(
                    afterState.simulatedRegions[beforeSimulatedRegion.id]!
                        .activities
                )[0] as TransferPatientToHospitalActivityState;

                const patientUUIDSet = {
                    [smallestUUID]: true,
                };

                expect(activity).toBeDefined();
                expect(activity.type).toBe('transferPatientToHospitalActivity');
                expect(activity.patientIds).toStrictEqual(patientUUIDSet);

                expect(
                    afterBehaviorState.patientIdsSelectedForTransfer
                ).toStrictEqual(patientUUIDSet);
            });

            it('selects as many patients as the vehicle has capacity for', () => {
                const redPatients: WritableDraft<Patient>[] = [];

                const {
                    afterState,
                    beforeSimulatedRegion,
                    afterBehaviorState,
                } = setupStateAndInteract((state, simulatedRegion) => {
                    const mutableVehicle = cloneDeepMutable(vehicle);
                    mutableVehicle.patientCapacity = 3;
                    state.vehicles[mutableVehicle.id] = mutableVehicle;

                    for (let i = 0; i < 3; i++) {
                        redPatients.push(
                            addPatient(
                                state,
                                'red',
                                'red',
                                newSimulatedRegionPositionIn(simulatedRegion.id)
                            )
                        );
                    }

                    for (let i = 0; i < 3; i++) {
                        addPatient(
                            state,
                            'yellow',
                            'yellow',
                            newSimulatedRegionPositionIn(simulatedRegion.id)
                        );
                    }

                    simulatedRegion.inEvents.push(
                        cloneDeepMutable(
                            newVehicleArrivedEvent(
                                mutableVehicle.id,
                                state.currentTime
                            )
                        )
                    );
                });

                const activity = Object.values(
                    afterState.simulatedRegions[beforeSimulatedRegion.id]!
                        .activities
                )[0] as TransferPatientToHospitalActivityState;

                const patientsUUIDSet: WritableDraft<UUIDSet> = {};
                redPatients.forEach(
                    (patient) => (patientsUUIDSet[patient.id] = true)
                );

                expect(activity).toBeDefined();
                expect(activity.type).toBe('transferPatientToHospitalActivity');
                expect(activity.patientIds).toStrictEqual(patientsUUIDSet);

                expect(
                    afterBehaviorState.patientIdsSelectedForTransfer
                ).toStrictEqual(patientsUUIDSet);
            });
        });
    });

    describe('on tick', () => {
        it('resets the selected patients', () => {
            const { afterBehaviorState } = setupStateAndInteract(
                (_, simulatedRegion, behaviorState) => {
                    for (let i = 0; i < 5; i++) {
                        behaviorState.patientIdsSelectedForTransfer[uuid()] =
                            true;
                    }

                    simulatedRegion.inEvents.push(
                        cloneDeepMutable(newTickEvent(1_000))
                    );
                }
            );

            expect(
                afterBehaviorState.patientIdsSelectedForTransfer
            ).toBeEmptyObject();
        });

        it('does not send an event or update the counter if nothing changed', () => {
            const { beforeState, afterState } = setupStateAndInteract(
                (_, simulatedRegion) => {
                    simulatedRegion.inEvents.push(
                        cloneDeepMutable(newTickEvent(1_000))
                    );
                }
            );

            const expectedState = removeEvents(beforeState);

            expect(afterState).toStrictEqual(expectedState);
        });

        it('sends an event if a category has been completed', () => {
            const { afterState, beforeSimulatedRegion } = setupStateAndInteract(
                (state, simulatedRegion, behaviorState) => {
                    const selectedUUID = uuid();

                    addPatient(
                        state,
                        'red',
                        'red',
                        newSimulatedRegionPositionIn(simulatedRegion.id),
                        selectedUUID
                    );

                    behaviorState.patientIdsSelectedForTransfer[selectedUUID] =
                        true;

                    simulatedRegion.inEvents.push(
                        cloneDeepMutable(newTickEvent(1_000))
                    );
                }
            );

            const activity = Object.values(
                afterState.simulatedRegions[beforeSimulatedRegion.id]!
                    .activities
            )[0] as DelayEventActivityState;

            expect(activity.event.type).toBe(
                'patientCategoryTransferToHospitalFinishedEvent'
            );
            expect(
                (
                    activity.event as PatientCategoryTransferToHospitalFinishedEvent
                ).patientCategory
            ).toBe('red');
        });

        it('does not send an event if a category still has patients', () => {
            const { afterSimulatedRegion } = setupStateAndInteract(
                (state, simulatedRegion, behaviorState) => {
                    const selectedUUID = uuid();

                    addPatient(
                        state,
                        'red',
                        'red',
                        newSimulatedRegionPositionIn(simulatedRegion.id),
                        selectedUUID
                    );
                    addPatient(
                        state,
                        'red',
                        'red',
                        newSimulatedRegionPositionIn(simulatedRegion.id)
                    );

                    behaviorState.patientIdsSelectedForTransfer[selectedUUID] =
                        true;

                    simulatedRegion.inEvents.push(
                        cloneDeepMutable(newTickEvent(1_000))
                    );
                }
            );

            // Event would be sent trough an DelayEventActivity
            expect(afterSimulatedRegion.activities).toBeEmpty();
        });

        it('updates the counter of transferred patients', () => {
            const { beforeBehaviorState, afterBehaviorState } =
                setupStateAndInteract(
                    (state, simulatedRegion, behaviorState) => {
                        const selectedUUID = uuid();

                        addPatient(
                            state,
                            'red',
                            'red',
                            newSimulatedRegionPositionIn(simulatedRegion.id),
                            selectedUUID
                        );

                        behaviorState.patientIdsSelectedForTransfer[
                            selectedUUID
                        ] = true;

                        simulatedRegion.inEvents.push(
                            cloneDeepMutable(newTickEvent(1_000))
                        );
                    }
                );

            expect(afterBehaviorState.transferredPatientsCount).toStrictEqual({
                ...beforeBehaviorState.transferredPatientsCount,
                red: beforeBehaviorState.transferredPatientsCount.red + 1,
            });
        });
    });
});
