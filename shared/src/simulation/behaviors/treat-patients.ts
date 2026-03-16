import { Type } from 'class-transformer';
import {
    IsInt,
    IsOptional,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { groupBy } from 'lodash-es';
import { WritableDraft } from 'immer';
import type {
    PatientCountRadiogram,
    TreatmentStatusRadiogram,
} from '../../models/radiogram/index.js';
import {
    getCreate,
    isInSpecificSimulatedRegion,
} from '../../models/utils/index.js';
import type { ExerciseState } from '../../state.js';
import { getActivityById } from '../../store/action-reducers/utils/index.js';
import type { UUID } from '../../utils/index.js';
import { uuid, uuidValidationOptions } from '../../utils/index.js';
import { IsLiteralUnion, IsValue } from '../../utils/validators/index.js';
import { DelayEventActivityState } from '../activities/index.js';
import { ReassignTreatmentsActivityState } from '../activities/reassign-treatments.js';
import { addActivity, terminateActivity } from '../activities/utils.js';
import { TreatmentsTimerEvent } from '../events/treatments-timer-event.js';
import { nextUUID } from '../utils/randomness.js';
import type { TreatmentProgress } from '../utils/treatment.js';
import { treatmentProgressAllowedValues } from '../utils/treatment.js';
import { Patient } from '../../models/patient.js';
import type { SimulatedRegion } from '../../models/simulated-region.js';
import type {
    SimulationBehavior,
    SimulationBehaviorState,
} from './simulation-behavior.js';

export class TreatPatientsIntervals {
    /**
     * How frequent reassignments should occur when the personnel just arrived and the situation in unclear
     */
    @IsInt()
    @Min(0)
    public readonly unknown: number;

    /**
     * How frequent reassignments should occur when the patients have been counted
     */
    @IsInt()
    @Min(0)
    public readonly counted: number;

    /**
     * How frequent reassignments should occur when all patients are triaged
     */
    @IsInt()
    @Min(0)
    public readonly triaged: number;

    /**
     * How frequent reassignments should occur when there is enough personnel to fulfil each patient's treatment needs
     */
    @IsInt()
    @Min(0)
    public readonly secured: number;

    /**
     * How long counting each patient should take.
     * Counting will be finished after {patient count} times this value.
     */
    @IsInt()
    @Min(0)
    public readonly countingTimePerPatient: number;

    constructor(
        unknown: number,
        counted: number,
        triaged: number,
        secured: number,
        countingTimePerPatient: number
    ) {
        this.unknown = unknown;
        this.counted = counted;
        this.triaged = triaged;
        this.secured = secured;
        this.countingTimePerPatient = countingTimePerPatient;
    }

    static readonly create = getCreate(this);
}

export class TreatPatientsBehaviorState implements SimulationBehaviorState {
    @IsValue('treatPatientsBehavior' as const)
    readonly type = `treatPatientsBehavior`;

    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @Type(() => TreatPatientsIntervals)
    @ValidateNested()
    public readonly intervals: TreatPatientsIntervals =
        TreatPatientsIntervals.create(
            1000 * 10, // 10 seconds
            1000 * 60, // 1 minute, as this is how long it takes to triage one patient
            1000 * 60 * 5, // 5 minutes
            1000 * 60 * 10, // 10 minutes
            1000 * 20 // 20 seconds
        );

    @IsOptional()
    @IsUUID(4, uuidValidationOptions)
    public readonly delayActivityId: UUID | null = null;

    @IsOptional()
    @IsUUID(4, uuidValidationOptions)
    public readonly treatmentActivityId: UUID | null = null;

    @IsLiteralUnion(treatmentProgressAllowedValues)
    public readonly treatmentProgress: TreatmentProgress = 'noTreatment';

    static readonly create = getCreate(this);
}

export const treatPatientsBehavior: SimulationBehavior<TreatPatientsBehaviorState> =
    {
        behaviorState: TreatPatientsBehaviorState,
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
                            DelayEventActivityState.create(
                                id,
                                TreatmentsTimerEvent.create(),
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
                                    Patient.getVisibleStatus(
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
        ReassignTreatmentsActivityState.create(
            id,
            behaviorState.treatmentProgress,
            behaviorState.intervals.countingTimePerPatient
        )
    );
    behaviorState.treatmentActivityId = id;
}
