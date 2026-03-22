import { z } from 'zod';
import { uuid, uuidSchema } from '../utils/uuid.js';
import { exerciseSimulationEventSchema } from '../simulation/events/exercise-simulation-event.js';
import { exerciseSimulationBehaviorStateSchema } from '../simulation/behaviors/exercise-simulation-behavior.js';
import { exerciseSimulationActivityStateSchema } from '../simulation/activities/exercise-simulation-activity.js';
import type { ImageProperties } from './utils/image-properties.js';
import { positionSchema } from './utils/position/position.js';
import { type Size, sizeSchema } from './utils/size.js';
import type { MapCoordinates } from './utils/position/map-coordinates.js';
import { newMapPositionAt } from './utils/position/map-position.js';

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
