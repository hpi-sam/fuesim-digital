import {
    EvalCriterionId,
    type EvalCriterion,
    type Patient,
    type PatientStatus,
    type TechnicalChallengeId,
    type TechnicalChallengeStateId,
    type UUID,
} from 'fuesim-digital-shared';

export interface InputData {
    name: string;
    countInput: number;
    timestampInput: number;
    patientStatusInput: PatientStatus;
    patientTargetStatusMap: { [id: UUID]: PatientStatus };
    technicalChallengeId: TechnicalChallengeId | '';
    targetTechnicalChallengeState: TechnicalChallengeStateId | '';
    targetPatients: Patient[];
    targetScoutableId: UUID | '';
    subCriteria: EvalCriterion[];
    singleSubCriterion: EvalCriterionId | '';
}
