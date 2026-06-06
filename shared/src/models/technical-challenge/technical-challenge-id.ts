import type { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';

export const technicalChallengeIdSchema = uuidSchema.brand(
    'TechnicalChallengeId'
);
export type TechnicalChallengeId = z.infer<typeof technicalChallengeIdSchema>;
