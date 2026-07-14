import { z } from 'zod';
import type { Immutable } from 'immer';

export const simulationEventSchema = z.strictObject({
    type: z.templateLiteral([z.string(), `Event`]),
});
export type SimulationEvent = Immutable<z.infer<typeof simulationEventSchema>>;
