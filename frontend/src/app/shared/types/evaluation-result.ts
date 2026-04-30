import { UUID } from 'fuesim-digital-shared';
export interface EvalResult {
    isCompleted: boolean;
    criterionId: UUID;
    count?: number;
    timestamp?: number;
}
