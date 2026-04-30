import z from 'zod';
import { UUID, uuidSchema } from '../utils/uuid.js';

export const evalResultSchema = z.strictObject({
    isCompleted: z.boolean(),
    criterionId: uuidSchema,
    count: z.number().nullable(),
    timestamp: z.number().nullable(),
});
export type EvalResult = z.infer<typeof evalResultSchema>;

export function newEvaluationResult(
    isCompleted: boolean,
    criterionId: UUID,
    count?: number,
    timeStamp?: number
): EvalResult {
    return {
        isCompleted: isCompleted,
        criterionId: criterionId,
        count: count ?? null,
        timestamp: timeStamp ?? null,
    };
}
