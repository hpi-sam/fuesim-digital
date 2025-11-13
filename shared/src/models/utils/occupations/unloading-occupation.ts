import * as z from 'zod';

export const unloadingOccupationSchema = z.strictObject({
    type: z.literal('unloadingOccupation'),
});

export interface UnloadingOccupation {
    type: 'unloadingOccupation';
}
