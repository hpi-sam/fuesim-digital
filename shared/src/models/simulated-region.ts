import { z } from 'zod';
import { uuidSchema, uuid } from '../utils/index.js';
import {
    exerciseSimulationEventSchema,
    exerciseSimulationActivityStateSchema,
    exerciseSimulationBehaviorStateSchema,
} from '../simulation/index.js';
import { newMapPositionAt, sizeSchema, positionSchema } from './utils/index.js';
import type { Size, ImageProperties, MapCoordinates } from './utils/index.js';

export const simulatedRegionSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('simulatedRegion'),
    position: positionSchema,
    size: sizeSchema,
    name: z.string(),
    borderColor: z.string(),
    inEvents: z.array(exerciseSimulationEventSchema),
    behaviors: z.array(exerciseSimulationBehaviorStateSchema),
    activities: z.record(uuidSchema, exerciseSimulationActivityStateSchema),
});
export type SimulatedRegion = z.infer<typeof simulatedRegionSchema>;

export function newSimulatedRegion(
    position: MapCoordinates,
    size: Size,
    name: string,
    borderColor: string = '#cccc00'
): SimulatedRegion {
    return {
        id: uuid(),
        type: 'simulatedRegion',
        position: newMapPositionAt(position),
        size,
        name,
        borderColor,
        inEvents: [],
        behaviors: [],
        activities: {},
    };
}

export const simulatedRegionImage: ImageProperties = {
    url: 'assets/simulated-region.svg',
    height: 1800,
    aspectRatio: 1600 / 900,
};
