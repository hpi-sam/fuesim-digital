/* eslint-disable no-bitwise */
import { IsInt, Min, ValidateIf } from 'class-validator';
import { sha256 } from '@noble/hashes/sha256';
import { v4 } from 'uuid';
import { WritableDraft } from 'immer';
import { getCreate } from '../../models/utils/get-create.js';
import type { ExerciseState } from '../../state.js';
import type { UUID } from '../../utils/index.js';
import { IsLiteralUnion, IsValue } from '../../utils/validators/index.js';

export class RandomState {
    @IsValue('randomState' as const)
    readonly type = 'randomState';

    @IsLiteralUnion({ 'sha256-id-ctr': true })
    readonly algo = 'sha256-id-ctr';

    @ValidateIf((o) => o.algo === 'sha256-id-ctr')
    @IsInt()
    @Min(0)
    readonly counter: number = 0;

    static readonly create = getCreate(this);
}

export function seededRandomState() {
    return RandomState.create();
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
