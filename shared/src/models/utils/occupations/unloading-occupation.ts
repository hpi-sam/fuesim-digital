import * as z from 'zod';

export const unloadingOccupationSchema = z.strictObject({
    type: z.literal('unloadingOccupation'),
});

export type UnloadingOccupation = z.infer<typeof unloadingOccupationSchema>;

export function newUnloadingOccupation(): UnloadingOccupation {
    return {
        type: 'unloadingOccupation',
    };
}
