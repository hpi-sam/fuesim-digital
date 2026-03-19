import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import type { ReportableInformation } from '../behaviors/reportable-information.js';
import { reportableInformationAllowedValues } from '../behaviors/reportable-information.js';
import { simulationEventSchema } from './simulation-event.js';

export const collectInformationEventSchema = simulationEventSchema.extend({
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
