import type {
    EvalCriterion,
    Patient,
    PatientStatus,
    TechnicalChallengeId,
    TechnicalChallengeStateId,
    UUID,
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
    singleSubCriterion: UUID | '';
}
