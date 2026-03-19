import { z } from 'zod';
import type { ReportableInformation } from '../behaviors/reportable-information.js';
import { reportableInformationSchema } from '../behaviors/reportable-information.js';
import { simulationEventSchema } from './simulation-event.js';

export const startCollectingInformationSchema = simulationEventSchema.extend({
    type: z.literal('startCollectingInformationEvent'),
    informationType: reportableInformationSchema,
    interfaceSignallerKey: z.string().nullable(),
});
export type StartCollectingInformationEvent = z.infer<
    typeof startCollectingInformationSchema
>;

export function newStartCollectingInformationEvent(
    informationType: ReportableInformation,
    interfaceSignallerKey: string | null = null
): StartCollectingInformationEvent {
    return {
        type: 'startCollectingInformationEvent',
        informationType,
        interfaceSignallerKey,
    };
}
