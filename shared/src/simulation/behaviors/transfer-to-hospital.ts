import { IsUUID } from 'class-validator';
import { difference, groupBy } from 'lodash-es';
import { WritableDraft } from 'immer';
import { z } from 'zod';
import { IsValue } from '../../utils/validators/is-value.js';
import type { UUID, UUIDSet } from '../../utils/index.js';
import {
    stringCompare,
    uuid,
    uuidValidationOptions,
} from '../../utils/index.js';
import {
    PatientStatus,
    patientStatusSchema,
    getCreate,
    isInSpecificSimulatedRegion,
    patientStatusAllowedValues,
} from '../../models/index.js';
import { getPatientVisibleStatus, Patient } from '../../models/patient.js';
import type { ExerciseState } from '../../state.js';
import { addActivity } from '../activities/utils.js';
import { DelayEventActivityState } from '../activities/index.js';
import { nextUUID } from '../utils/randomness.js';
import { PatientCategoryTransferToHospitalFinishedEvent } from '../events/index.js';
import {
    getActivityById,
    tryGetElement,
} from '../../store/action-reducers/utils/index.js';
import { IsUUIDSet } from '../../utils/validators/index.js';
import { TransferPatientToHospitalActivityState } from '../activities/transfer-patient-to-hospital.js';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import type { TransferCountsRadiogram } from '../../models/radiogram/index.js';
import { logLastPatientTransportedInSimulatedRegion } from '../../store/action-reducers/utils/log.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import type {
    SimulationBehavior,
    SimulationBehaviorState,
} from './simulation-behavior.js';

export class TransferToHospitalBehaviorState
    implements SimulationBehaviorState
{
    @IsValue('transferToHospitalBehavior')
    readonly type = 'transferToHospitalBehavior';

    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsUUIDSet()
    public readonly patientIdsSelectedForTransfer: UUIDSet = {};

    @IsZodSchema(z.record(patientStatusSchema, z.number()))
    public readonly transferredPatientsCount: ResourceDescription<PatientStatus> =
        {
            red: 0,
            yellow: 0,
            green: 0,
            blue: 0,
            black: 0,
            white: 0,
        };

    static readonly create = getCreate(this);
}

export const transferToHospitalBehavior: SimulationBehavior<TransferToHospitalBehaviorState> =
    {
        behaviorState: TransferToHospitalBehaviorState,
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
                        TransferPatientToHospitalActivityState.create(
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
                                    DelayEventActivityState.create(
                                        nextUUID(draftState),
                                        PatientCategoryTransferToHospitalFinishedEvent.create(
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
