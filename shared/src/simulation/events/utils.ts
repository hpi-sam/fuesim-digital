import type { WritableDraft } from 'immer';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import type { SimulatedRegion } from '../../models/simulated-region.js';
import type { ExerciseSimulationEvent } from './exercise-simulation-event.js';

export function sendSimulationEvent(
    simulatedRegion: WritableDraft<SimulatedRegion>,
    event: ExerciseSimulationEvent
) {
    simulatedRegion.inEvents.push(cloneDeepMutable(event));
}
