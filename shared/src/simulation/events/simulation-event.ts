import { z } from 'zod';

export const simulationEventSchema = z.strictObject({
    type: z.templateLiteral([z.string(), `Event`]),
});
export type SimulationEvent = z.infer<typeof simulationEventSchema>;
