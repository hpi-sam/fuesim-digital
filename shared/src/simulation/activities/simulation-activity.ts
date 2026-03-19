import type { WritableDraft } from 'immer';
import type { ZodType } from 'zod';
import { z } from 'zod';
import type { SimulatedRegion } from '../../models/index.js';
import type { ExerciseState } from '../../state.js';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';

export const simulationActivityStateSchema = z.strictObject({
    type: z.string(),
    id: uuidSchema,
});
export type SimulationActivityState = z.infer<
    typeof simulationActivityStateSchema
>;

export interface SimulationActivity<S extends SimulationActivityState> {
    readonly activityStateSchema: ZodType<S>;
    readonly tick: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        activityState: WritableDraft<S>,
        tickInterval: number,
        terminate: () => void
    ) => void;
    readonly onTerminate?: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        activityId: UUID
    ) => void;
}
