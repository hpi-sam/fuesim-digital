/* eslint-disable no-bitwise */
import { sha256 } from '@noble/hashes/sha256';
import { v4 } from 'uuid';
import type { WritableDraft } from 'immer';
import { z } from 'zod';
import type { ExerciseState } from '../../state.js';
import type { UUID } from '../../utils/uuid.js';

export const randomStateSchema = z.strictObject({
    type: z.literal('randomState'),
    algo: z.literal('sha256-id-ctr'),
    counter: z.int().nonnegative(),
});
export type RandomState = z.infer<typeof randomStateSchema>;

export function newSeededRandomState(): RandomState {
    return {
        type: 'randomState',
        algo: 'sha256-id-ctr',
        counter: 0,
    };
}

export function nextBool(
    draftState: WritableDraft<ExerciseState>,
    probability: number = 0.5
): boolean {
    return nextInt(draftState, 4294967296) / 4294967296 < probability;
}

export function nextUUID(draftState: WritableDraft<ExerciseState>): UUID {
    return v4({
        random: advance(draftState),
    });
}

/**
 * Draws the next integer from a pseudo random number generator persisted in `draftState`.
 * @param draftState The exercise state where the pseudo random number generator state is stored
 * @param upperBound The exclusive upper bound of the return value
 *      Must be a positive integer not greater than `4294967296`, or `2**32`
 * @returns An integer from `0` (inclusive) to `upperBound` (exclusive)
 */
export function nextInt(
    draftState: WritableDraft<ExerciseState>,
    upperBound: number
): number {
    const state = advance(draftState)
        .slice(0, 4)
        .map((b, i) => Math.trunc(b * 256 ** i))
        .reduce((a, b) => a | b);
    return Math.trunc(state % upperBound);
}

/**
 * Draws the next bytes from a pseudo random number generator persisted in `draftState`.
 * @param draftState The exercise state where the pseudo random number generator state is stored
 * @returns An array of length 32 (specific to sha256) of numbers from 0-255
 */
function advance(draftState: WritableDraft<ExerciseState>): Uint8Array {
    const state = draftState.randomState;
    const result = sha256(`${draftState.id}${state.counter.toString()}`);
    state.counter++;
    return result;
}
