import type { UUID } from 'fuesim-digital-shared';
import type { EvalCriterion } from '../../../../../shared/dist/models/evaluation-criterion';
export interface EvalResult {
    criterionId: UUID;
    criterion: EvalCriterion;
    isCompleted: boolean;
    count?: number;
    /* TODO @JohannesPotzi @Jogius : Do we drop this? */
    timestamp?: number;
}
