import { z } from 'zod';
import type { Immutable } from 'immer';

export const pretriageInformationSchema = z.strictObject({
    injuries: z.string(),
    bodyCheck: z.string(),
    isWalkable: z.boolean(),
    breathing: z.string(),
    awareness: z.string(),
    pulse: z.string(),
    skin: z.string(),
    pain: z.string(),
    pupils: z.string(),
    psyche: z.string(),
    hearing: z.string(),
});

export type PretriageInformation = Immutable<
    z.infer<typeof pretriageInformationSchema>
>;
