import type {
    EvalCriterion,
    EvalCriterionId,
    Patient,
    PatientStatus,
    TechnicalChallengeId,
    TechnicalChallengeStateId,
    UUID,
} from 'fuesim-digital-shared';

export interface InputData {
    name: string;
    countInput: number;
    targetPatients: Patient[];
    patientStatusInput: PatientStatus;
    patientTargetStatusMap: { [id: UUID]: PatientStatus };
    technicalChallengeId: TechnicalChallengeId | '';
    targetTechnicalChallengeState: TechnicalChallengeStateId | '';
    subCriteria: (EvalCriterion | null)[];
}
