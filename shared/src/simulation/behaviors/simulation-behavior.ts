import type { WritableDraft } from 'immer';
import { string, z } from 'zod';
import type { SimulatedRegion } from '../../models/index.js';
import type { ExerciseState } from '../../state.js';
import { uuidSchema } from '../../utils/index.js';
import type { ExerciseSimulationEvent } from '../events/index.js';

export const simulationBehaviorStateSchema = z.strictObject({
    type: z.literal(`${string}Behavior`),
    id: uuidSchema,
});

export type SimulationBehaviorState = z.infer<
    typeof simulationBehaviorStateSchema
>;

export interface SimulationBehavior<S extends SimulationBehaviorState> {
    readonly behaviorStateSchema: z.ZodType<S>;
    readonly newBehaviorState: (...args: any) => S;
    readonly handleEvent: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<S>,
        event: WritableDraft<ExerciseSimulationEvent>
    ) => void;
    readonly onRemove?: (
        draftState: WritableDraft<ExerciseState>,
        simulatedRegion: WritableDraft<SimulatedRegion>,
        behaviorState: WritableDraft<S>
    ) => void;
}
