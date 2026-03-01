import type { WritableDraft } from 'immer';
import type { SimulatedRegion } from '../../models/index.js';
import type { ExerciseState } from '../../state.js';
import type { Constructor, UUID } from '../../utils/index.js';

export class SimulationActivityState {
    readonly type!: `${string}Activity`;
    readonly id!: UUID;
}

export interface SimulationActivity<S extends SimulationActivityState> {
    readonly activityState: Constructor<S>;
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
