import { z } from 'zod';

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

export type PretriageInformation = z.infer<typeof pretriageInformationSchema>;
