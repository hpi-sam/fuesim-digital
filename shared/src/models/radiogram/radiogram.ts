import { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';
import { exerciseRadiogramStatusSchema } from './status/exercise-radiogram-status.js';

export const radiogramSchema = z.strictObject({
    id: uuidSchema,
    type: z.templateLiteral([z.string(), 'Radiogram']),
    simulatedRegionId: uuidSchema,
    status: exerciseRadiogramStatusSchema,
    informationAvailable: z.boolean(),
    informationRequestKey: z.string().nullable(),
});
