import { groupBy } from 'lodash-es';
import type { WritableDraft } from 'immer';
import { z } from 'zod';
import type {
    PatientCountRadiogram,
    TreatmentStatusRadiogram,
} from '../../models/radiogram/index.js';
import { isInSpecificSimulatedRegion } from '../../models/utils/index.js';
import type { ExerciseState } from '../../state.js';
import { getActivityById } from '../../store/action-reducers/utils/index.js';
import { uuidSchema, uuid } from '../../utils/index.js';
import {
    newDelayEventActivityState,
    newReassignTreatmentsActivityState,
} from '../activities/index.js';
import { addActivity, terminateActivity } from '../activities/utils.js';
import { newTreatmentsTimerEvent } from '../events/treatments-timer-event.js';
import { nextUUID } from '../utils/randomness.js';
import { treatmentProgressSchema } from '../utils/treatment.js';
import type { SimulatedRegion } from '../../models/simulated-region.js';
import { getPatientVisibleStatus } from '../../models/patient.js';
import type { SimulationBehavior } from './simulation-behavior.js';
import { simulationBehaviorStateSchema } from './simulation-behavior.js';

export const treatPatientsIntervalsSchema = z.strictObject({
    /**
     * How frequent reassignments should occur when the personnel just arrived and the situation in unclear
     */
    unknown: z.int().nonnegative(),
    /**
     * How frequent reassignments should occur when the patients have been counted
     */
    counted: z.int().nonnegative(),
    /**
     * How frequent reassignments should occur when all patients are triaged
     */
    triaged: z.int().nonnegative(),
    /**
     * How frequent reassignments should occur when there is enough personnel to fulfil each patient's treatment needs
     */
    secured: z.int().nonnegative(),
    /**
     * How long counting each patient should take.
     * Counting will be finished after {patient count} times this value.
     */
    countingTimePerPatient: z.int().nonnegative(),
});
export type TreatPatientsIntervals = z.infer<
    typeof treatPatientsIntervalsSchema
>;

export function newTreatPatientsIntervals(
    unknown: number,
    counted: number,
    triaged: number,
    secured: number,
    countingTimePerPatient: number
): TreatPatientsIntervals {
    return {
        unknown,
        counted,
        triaged,
        secured,
        countingTimePerPatient,
    };
}

export const treatPatientsBehaviorStateSchema = z.strictObject({
    ...simulationBehaviorStateSchema.shape,
    type: z.literal('treatPatientsBehavior'),
    intervals: treatPatientsIntervalsSchema,
    delayActivityId: uuidSchema.nullable(),
    treatmentActivityId: uuidSchema.nullable(),
    treatmentProgress: treatmentProgressSchema,
});
export type TreatPatientsBehaviorState = z.infer<
    typeof treatPatientsBehaviorStateSchema
>;

export function newTreatPatientsBehaviorState(): TreatPatientsBehaviorState {
    return {
        id: uuid(),
        type: 'treatPatientsBehavior',
        intervals: newTreatPatientsIntervals(
            1000 * 10, // 10 seconds
            1000 * 60, // 1 minute, as this is how long it takes to triage one patient
            1000 * 60 * 5, // 5 minutes
            1000 * 60 * 10, // 10 minutes
            1000 * 20 // 20 seconds
        ),
        delayActivityId: null,
        treatmentActivityId: null,
        treatmentProgress: 'noTreatment',
    };
}

export const treatPatientsBehavior: SimulationBehavior<TreatPatientsBehaviorState> =
    {
        behaviorStateSchema: treatPatientsBehaviorStateSchema,
        newBehaviorState: newTreatPatientsBehaviorState,
        handleEvent(draftState, simulatedRegion, behaviorState, event) {
            switch (event.type) {
                case 'tickEvent':
                    if (behaviorState.treatmentProgress === 'noTreatment') {
                        startNewTreatmentReassignment(
                            draftState,
                            simulatedRegion,
                            behaviorState
                        );
                        break;
                    }

                    if (
                        behaviorState.delayActivityId === null &&
                        (behaviorState.treatmentActivityId === null ||
                            simulatedRegion.activities[
                                behaviorState.treatmentActivityId
                            ] === undefined)
                    ) {
                        const id = nextUUID(draftState);
                        addActivity(
                            simulatedRegion,
                            newDelayEventActivityState(
                                id,
                                newTreatmentsTimerEvent(),
                                draftState.currentTime +
                                    behaviorState.intervals[
                                        behaviorState.treatmentProgress
                                    ]
                            )
                        );
                        behaviorState.delayActivityId = id;
                    }
                    break;
                case 'treatmentProgressChangedEvent':
                case 'materialAvailableEvent':
                case 'materialRemovedEvent':
                case 'newPatientEvent':
                case 'patientRemovedEvent':
                case 'personnelAvailableEvent':
                case 'personnelRemovedEvent':
                case 'leaderChangedEvent':
                case 'treatmentsTimerEvent': {
                    if (event.type === 'treatmentProgressChangedEvent') {
                        behaviorState.treatmentProgress = event.newProgress;
                    }
                    if (behaviorState.delayActivityId) {
                        if (
                            simulatedRegion.activities[
                                behaviorState.delayActivityId
                            ]
                        ) {
                            terminateActivity(
                                draftState,
                                simulatedRegion,
                                behaviorState.delayActivityId
                            );
                        }

                        behaviorState.delayActivityId = null;
                    }

                    startNewTreatmentReassignment(
                        draftState,
                        simulatedRegion,
                        behaviorState
                    );

                    break;
                }
                case 'collectInformationEvent': {
                    if (behaviorState.treatmentProgress === 'noTreatment') {
                        // noTreatment indicated that there is no leader
                        // Therefore, queries should not be answered
                        return;
                    }

                    const collectInformationEvent = event;

                    const radiogram = getActivityById(
                        draftState,
                        simulatedRegion.id,
                        event.generateReportActivityId,
                        'generateReportActivity'
                    ).radiogram;

                    switch (collectInformationEvent.informationType) {
                        // This behavior answerers this query because the treating personnel has the knowledge of how many patients are in a given category
                        case 'patientCount': {
                            if (behaviorState.treatmentProgress === 'unknown') {
                                // The patients haven't been counted yet
                                return;
                            }

                            const patientCountRadiogram =
                                radiogram as WritableDraft<PatientCountRadiogram>;

                            const patientCount =
                                patientCountRadiogram.patientCount;
                            const patients = Object.values(
                                draftState.patients
                            ).filter((patient) =>
                                isInSpecificSimulatedRegion(
                                    patient,
                                    simulatedRegion.id
                                )
                            );
                            const groupedPatients = groupBy(
                                patients,
                                (patient) =>
                                    getPatientVisibleStatus(
                                        patient,
                                        draftState.configuration
                                            .pretriageEnabled,
                                        draftState.configuration
                                            .bluePatientsEnabled
                                    )
                            );
                            patientCount.black =
                                groupedPatients['black']?.length ?? 0;
                            patientCount.white =
                                groupedPatients['white']?.length ?? 0;
                            patientCount.red =
                                groupedPatients['red']?.length ?? 0;
                            patientCount.yellow =
                                groupedPatients['yellow']?.length ?? 0;
                            patientCount.green =
                                groupedPatients['green']?.length ?? 0;
                            patientCount.blue =
                                groupedPatients['blue']?.length ?? 0;

                            patientCountRadiogram.informationAvailable = true;
                            break;
                        }
                        case 'treatmentStatus': {
                            const treatmentStatusRadiogram =
                                radiogram as WritableDraft<TreatmentStatusRadiogram>;

                            treatmentStatusRadiogram.treatmentStatus =
                                behaviorState.treatmentProgress;

                            treatmentStatusRadiogram.informationAvailable = true;
                            break;
                        }
                        default:
                        // Ignore event, since this behavior can't answer this query
                    }

                    break;
                }
                default:
                // Ignore event
            }
        },
    };

function startNewTreatmentReassignment(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    behaviorState: WritableDraft<TreatPatientsBehaviorState>
) {
    if (
        behaviorState.treatmentActivityId &&
        simulatedRegion.activities[behaviorState.treatmentActivityId]
    ) {
        terminateActivity(
            draftState,
            simulatedRegion,
            behaviorState.treatmentActivityId
        );
        behaviorState.treatmentActivityId = null;
    }

    const id = nextUUID(draftState);
    addActivity(
        simulatedRegion,
        newReassignTreatmentsActivityState(
            id,
            behaviorState.treatmentProgress,
            behaviorState.intervals.countingTimePerPatient
        )
    );
    behaviorState.treatmentActivityId = id;
}
