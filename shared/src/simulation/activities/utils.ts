import type { WritableDraft } from 'immer';
import type { ExerciseState } from '../../state.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import type { UUID } from '../../utils/uuid.js';
import type { SimulatedRegion } from '../../models/simulated-region.js';
import { simulationActivityDictionary } from './exercise-simulation-activity.js';
import type { ExerciseSimulationActivityState } from './exercise-simulation-activity.js';

export function addActivity(
    simulatedRegion: WritableDraft<SimulatedRegion>,
    activityState: ExerciseSimulationActivityState
) {
    simulatedRegion.activities[activityState.id] =
        cloneDeepMutable(activityState);
}

export function terminateActivity(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    activityId: UUID
) {
    const activityType = simulatedRegion.activities[activityId]?.type;
    if (activityType) {
        const activity = simulationActivityDictionary[activityType];
        if (activity.onTerminate) {
            activity.onTerminate(draftState, simulatedRegion, activityId);
        }
        delete simulatedRegion.activities[activityId];
    }
}
