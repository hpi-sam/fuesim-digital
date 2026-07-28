import type { ExerciseAction, ExerciseState } from 'fuesim-digital-shared';
import { patientTick } from './patient-ticking.js';

/**
 * How many ticks have to pass until treatments get recalculated (e.g. with
 * {@link tickInterval} === 1000 and {@link REFRESH_TREATMENT_INTERVAL} === 20,
 * every 20 seconds).
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const REFRESH_TREATMENT_INTERVAL = 20;

/**
 * Builds an `[Exercise] Tick` action for {@link state}, advancing the exercise
 * by {@link tickInterval} ms. {@link tickCounter} is the number of ticks that
 * have already been applied to this exercise (used to decide whether treatments
 * should be refreshed on this tick).
 */
export function buildTickAction(
    state: ExerciseState,
    tickInterval: number,
    tickCounter: number
): ExerciseAction {
    return {
        type: '[Exercise] Tick',
        patientUpdates: patientTick(state, tickInterval),
        // TODO: Refactor this: do this in the reducer instead of sending it in the action
        refreshTreatments: tickCounter % REFRESH_TREATMENT_INTERVAL === 0,
        tickInterval,
    };
}
