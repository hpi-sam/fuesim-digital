import { difference, groupBy } from 'lodash-es';
import type { WritableDraft } from 'immer';
import { z } from 'zod';
import type { Patient } from '../../models/patient.js';
import { getPatientVisibleStatus } from '../../models/patient.js';
import type { ExerciseState } from '../../state.js';
import { addActivity } from '../activities/utils.js';
import { nextUUID } from '../utils/randomness.js';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import { logLastPatientTransportedInSimulatedRegion } from '../../store/action-reducers/utils/log.js';
import {
    type PatientStatus,
    patientStatusAllowedValues,
    patientStatusSchema,
} from '../../models/utils/patient-status.js';
import {
    getActivityById,
    tryGetElement,
} from '../../store/action-reducers/utils/get-element.js';
import { newTransferPatientToHospitalActivityState } from '../activities/transfer-patient-to-hospital.js';
import { newDelayEventActivityState } from '../activities/delay-event.js';
import { newPatientCategoryTransferToHospitalFinishedEvent } from '../events/patient-category-transfer-to-hospital-finished.js';
import type { TransferCountsRadiogram } from '../../models/radiogram/transfer-counts-radiogram.js';
import { uuid, type UUID } from '../../utils/uuid.js';
import { isInSpecificSimulatedRegion } from '../../models/utils/position/position-helpers.js';
import { type UUIDSet, uuidSetSchema } from '../../utils/uuid-set.js';
import { stringCompare } from '../../utils/string-compare.js';
import { simulationBehaviorStateSchema } from './simulation-behavior.js';
import type { SimulationBehavior } from './simulation-behavior.js';

export const transferToHospitalBehaviorStateSchema = z.strictObject({
    ...simulationBehaviorStateSchema.shape,
    type: z.literal('transferToHospitalBehavior'),
    patientIdsSelectedForTransfer: uuidSetSchema,
    transferredPatientsCount: z.record(
        patientStatusSchema,
        z.int().nonnegative()
    ),
});
export type TransferToHospitalBehaviorState = z.infer<
    typeof transferToHospitalBehaviorStateSchema
>;

export function newTransferToHospitalBehaviorState(): TransferToHospitalBehaviorState {
    return {
        id: uuid(),
        type: 'transferToHospitalBehavior',
        patientIdsSelectedForTransfer: {},
        transferredPatientsCount: {
            red: 0,
            yellow: 0,
            green: 0,
            blue: 0,
            black: 0,
            white: 0,
        },
    };
}

export const transferToHospitalBehavior: SimulationBehavior<TransferToHospitalBehaviorState> =
    {
        behaviorStateSchema: transferToHospitalBehaviorStateSchema,
        newBehaviorState: newTransferToHospitalBehaviorState,
        handleEvent: (draftState, simulatedRegion, behaviorState, event) => {
            switch (event.type) {
                case 'vehicleArrivedEvent': {
                    const vehicle = tryGetElement(
                        draftState,
                        'vehicle',
                        event.vehicleId
                    );

                    if (
                        vehicle?.occupation.type !== 'patientTransferOccupation'
                    ) {
                        // This vehicle is not meant to be used for patient transfer
                        break;
                    }

                    const patientsToTransfer: WritableDraft<UUIDSet> = {};

                    const groupedPatients = groupBy(
                        getOwnPatients(draftState, simulatedRegion.id)
                            .filter(
                                (patient) =>
                                    !Object.keys(
                                        behaviorState.patientIdsSelectedForTransfer
                                    ).includes(patient.id)
                            )
                            .sort((a, b) => stringCompare(a.id, b.id)),
                        (patient) =>
                            getVisiblePatientStatus(patient, draftState)
                    );

                    for (let i = 0; i < vehicle.patientCapacity; i++) {
                        const mostUrgentStatus = (
                            ['red', 'yellow', 'green', 'white', 'blue'] as const
                        ).find(
                            (status) =>
                                (groupedPatients[status]?.length ?? 0) > 0
                        );

                        if (!mostUrgentStatus) {
                            // No more patients to transfer
                            break;
                        }

                        const patientToTransfer =
                            groupedPatients[mostUrgentStatus]!.shift()!;

                        patientsToTransfer[patientToTransfer.id] = true;
                        behaviorState.patientIdsSelectedForTransfer[
                            patientToTransfer.id
                        ] = true;
                    }

                    if (Object.keys(patientsToTransfer).length === 0) {
                        // No patients to transfer
                        break;
                    }

                    addActivity(
                        simulatedRegion,
                        newTransferPatientToHospitalActivityState(
                            nextUUID(draftState),
                            patientsToTransfer,
                            event.vehicleId,
                            vehicle.occupation.transportManagementRegionId
                        )
                    );

                    break;
                }
                case 'tickEvent': {
                    const patients = getOwnPatients(
                        draftState,
                        simulatedRegion.id
                    );
                    const selectedPatients = patients.filter((patient) =>
                        Object.keys(
                            behaviorState.patientIdsSelectedForTransfer
                        ).includes(patient.id)
                    );
                    const remainingPatients = difference(
                        patients,
                        selectedPatients
                    );

                    const groupedPatients = groupBy(patients, (patient) =>
                        getVisiblePatientStatus(patient, draftState)
                    );
                    const groupedRemainingPatients = groupBy(
                        remainingPatients,
                        (patient) =>
                            getVisiblePatientStatus(patient, draftState)
                    );

                    patientStatusAllowedValues.forEach((status) => {
                        // If patients of this triage category just have been in this region
                        if ((groupedPatients[status]?.length ?? 0) > 0) {
                            // But there are no patients of this status right now
                            if (
                                (groupedRemainingPatients[status]?.length ??
                                    0) === 0
                            ) {
                                // Then we want to report that we have finished this triage category
                                // Note:
                                // These conditions can be true for multiple times in one exercise if patient statuses change or new patients are added
                                addActivity(
                                    simulatedRegion,
                                    newDelayEventActivityState(
                                        nextUUID(draftState),
                                        newPatientCategoryTransferToHospitalFinishedEvent(
                                            status,
                                            true
                                        ),
                                        draftState.currentTime
                                    )
                                );
                                logLastPatientTransportedInSimulatedRegion(
                                    draftState,
                                    status,
                                    simulatedRegion.id
                                );
                            }
                        }
                    });

                    selectedPatients.forEach((patient) => {
                        behaviorState.transferredPatientsCount[
                            getVisiblePatientStatus(patient, draftState)
                        ]++;
                    });

                    // The tick event itself is the last event per tick
                    // Therefore, we can reset our state here
                    behaviorState.patientIdsSelectedForTransfer = {};

                    break;
                }
                case 'collectInformationEvent': {
                    if (event.informationType !== 'singleRegionTransferCounts')
                        break;

                    const radiogram = getActivityById(
                        draftState,
                        simulatedRegion.id,
                        event.generateReportActivityId,
                        'generateReportActivity'
                    ).radiogram as WritableDraft<TransferCountsRadiogram>;

                    const remainingPatients = Object.fromEntries(
                        Object.entries(
                            groupBy(
                                getOwnPatients(draftState, simulatedRegion.id),
                                (patient) =>
                                    getVisiblePatientStatus(patient, draftState)
                            )
                        ).map(([key, value]) => [key, value.length])
                    ) as Partial<ResourceDescription<PatientStatus>>;

                    radiogram.scope = 'singleRegion';
                    radiogram.transferredPatientsCounts =
                        behaviorState.transferredPatientsCount;
                    radiogram.remainingPatientsCounts = {
                        red: 0,
                        yellow: 0,
                        green: 0,
                        blue: 0,
                        black: 0,
                        white: 0,
                        ...remainingPatients,
                    };
                    radiogram.informationAvailable = true;

                    break;
                }
                default:
                // Ignore event
            }
        },
    };

function getOwnPatients(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID
) {
    return Object.values(draftState.patients).filter((patient) =>
        isInSpecificSimulatedRegion(patient, simulatedRegionId)
    );
}

function getVisiblePatientStatus(patient: Patient, state: ExerciseState) {
    return getPatientVisibleStatus(
        patient,
        state.configuration.pretriageEnabled,
        state.configuration.bluePatientsEnabled
    );
}
