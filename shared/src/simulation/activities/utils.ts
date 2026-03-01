import type { WritableDraft } from 'immer';
import type { SimulatedRegion } from '../../models/index.js';
import type { ExerciseState } from '../../state.js';
import type { UUID } from '../../utils/index.js';
import { cloneDeepMutable } from '../../utils/index.js';
import type { ExerciseSimulationActivityState } from './exercise-simulation-activity.js';
import { simulationActivityDictionary } from './exercise-simulation-activity.js';

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
