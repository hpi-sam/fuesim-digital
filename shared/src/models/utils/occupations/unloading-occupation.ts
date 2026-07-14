import { z } from 'zod';
import type { Immutable } from 'immer';

export const unloadingOccupationSchema = z.strictObject({
    type: z.literal('unloadingOccupation'),
});

export type UnloadingOccupation = Immutable<
    z.infer<typeof unloadingOccupationSchema>
>;

export function newUnloadingOccupation(): UnloadingOccupation {
    return {
        type: 'unloadingOccupation',
    };
}
