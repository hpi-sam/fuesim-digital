import { z } from 'zod';
import type { ReportableInformation } from '../behaviors/reportable-information.js';
import { reportableInformationAllowedValues } from '../behaviors/reportable-information.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const collectInformationEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('collectInformationEvent'),
    generateReportActivityId: uuidSchema,
    informationType: reportableInformationAllowedValues,
});
export type CollectInformationEvent = z.infer<
    typeof collectInformationEventSchema
>;

export function newCollectInformationEvent(
    generateReportActivityId: UUID,
    informationType: ReportableInformation
): CollectInformationEvent {
    return {
        type: 'collectInformationEvent',
        generateReportActivityId,
        informationType,
    };
}
