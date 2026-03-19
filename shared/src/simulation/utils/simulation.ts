import type { WritableDraft } from 'immer';
import type { SimulatedRegion } from '../../models/index.js';
import type { ExerciseState } from '../../state.js';
import { simulationActivityDictionary } from '../activities/index.js';
import { terminateActivity } from '../activities/utils.js';
import { simulationBehaviorDictionary } from '../behaviors/index.js';
import { newTickEvent } from '../events/tick.js';
import { sendSimulationEvent } from '../events/utils.js';

export function simulateAllRegions(
    draftState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    Object.values(draftState.simulatedRegions).forEach((simulatedRegion) => {
        simulateSingleRegion(draftState, simulatedRegion, tickInterval);
    });
}

function simulateSingleRegion(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    tickInterval: number
) {
    sendSimulationEvent(simulatedRegion, newTickEvent(tickInterval));
    handleSimulationEvents(draftState, simulatedRegion);
    tickActivities(draftState, simulatedRegion, tickInterval);
}

function tickActivities(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    tickInterval: number
) {
    Object.values(simulatedRegion.activities).forEach((activityState) => {
        simulationActivityDictionary[activityState.type].tick(
            draftState,
            simulatedRegion,
            activityState as any,
            tickInterval,
            () => {
                terminateActivity(
                    draftState,
                    simulatedRegion,
                    activityState.id
                );
            }
        );
    });
}

export function handleSimulationEvents(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>
) {
    simulatedRegion.behaviors.forEach((behaviorState) => {
        simulatedRegion.inEvents.forEach((event) => {
            simulationBehaviorDictionary[behaviorState.type].handleEvent(
                draftState,
                simulatedRegion,
                behaviorState as any,
                event
            );
        });
    });
    simulatedRegion.inEvents = [];
}
