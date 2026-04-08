import type { WritableDraft } from 'immer';
import { z } from 'zod';
import type { ExerciseState } from '../../state.js';
import { uuidSchema } from '../../utils/uuid.js';
import type { SimulatedRegion } from '../../models/simulated-region.js';
import type { ExerciseSimulationEvent } from '../events/exercise-simulation-event.js';

export const simulationBehaviorStateSchema = z.strictObject({
    type: z.templateLiteral([z.string(), `Behavior`]),
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
