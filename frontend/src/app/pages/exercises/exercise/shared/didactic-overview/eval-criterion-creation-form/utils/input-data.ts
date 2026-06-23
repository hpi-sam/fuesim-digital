import type {
    Patient,
    PatientStatus,
    TechnicalChallengeId,
    TechnicalChallengeStateId,
    UUID,
} from 'fuesim-digital-shared';

export interface InputData {
    countInput: number;
    targetPatients: Patient[];
    patientStatusInput: PatientStatus;
    patientTargetStatusMap: { [id: UUID]: PatientStatus };
    technicalChallengeId: TechnicalChallengeId | '';
    targetTechnicalChallengeState: TechnicalChallengeStateId | '';
}
