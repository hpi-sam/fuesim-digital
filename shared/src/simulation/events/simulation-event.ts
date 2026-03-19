import { string, z } from 'zod';

export const simulationEventSchema = z.strictObject({
    type: z.literal(`${string}Event`),
});
export type SimulationEvent = z.infer<typeof simulationEventSchema>;
