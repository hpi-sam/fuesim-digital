import type {
    EvalCriterion,
    Patient,
    PatientStatus,
    StateMachineId,
    StateMachineStateId,
    TechnicalChallengeId,
    UUID,
} from 'fuesim-digital-shared';

export interface InputData {
    name: string;
    countInput: number;
    timestampInput: number;
    patientStatusInput: PatientStatus;
    patientTargetStatusMap: { [id: UUID]: PatientStatus };
    technicalChallengeId: TechnicalChallengeId | '';
    targetStateMachineIds: StateMachineId[];
    targetStateMachineStateIds: {
        [targetStateMachineId: StateMachineId]: StateMachineStateId;
    };
    targetPatients: Patient[];
    targetScoutableId: UUID | '';
    subCriteria: EvalCriterion[];
    singleSubCriterion: UUID | '';
}
