import type { UUID } from '../../utils/index.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export class Radiogram {
    readonly id!: UUID;
    readonly type!: `${string}Radiogram`;
    readonly simulatedRegionId!: UUID;
    readonly status!: ExerciseRadiogramStatus;
    readonly informationAvailable!: boolean;
    readonly informationRequestKey!: string | null;
}
