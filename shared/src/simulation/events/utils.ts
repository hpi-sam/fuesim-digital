import type { WritableDraft } from 'immer';
import type { SimulatedRegion } from '../../models/index.js';
import { cloneDeepMutable } from '../../utils/index.js';
import type { ExerciseSimulationEvent } from './exercise-simulation-event.js';

export function sendSimulationEvent(
    simulatedRegion: WritableDraft<SimulatedRegion>,
    event: ExerciseSimulationEvent
) {
    simulatedRegion.inEvents.push(cloneDeepMutable(event));
}
