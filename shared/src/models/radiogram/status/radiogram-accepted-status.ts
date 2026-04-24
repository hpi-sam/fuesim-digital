import { z } from 'zod';
import { type UUID, uuidSchema } from '../../../utils/uuid.js';
import { radiogramStatusSchema } from './radiogram-status.js';

export const radiogramAcceptedStatus = z.strictObject({
    ...radiogramStatusSchema.shape,
    type: z.literal('acceptedRadiogramStatus'),
    clientId: uuidSchema,
    publishTime: z.int().nonnegative(),
});
export type RadiogramAcceptedStatus = z.infer<typeof radiogramAcceptedStatus>;

export function newRadiogramAcceptedStatus(
    clientId: UUID,
    publishTime: number
): RadiogramAcceptedStatus {
    return {
        type: 'acceptedRadiogramStatus',
        clientId,
        publishTime,
    };
}
