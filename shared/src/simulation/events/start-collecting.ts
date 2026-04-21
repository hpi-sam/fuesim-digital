import { z } from 'zod';
import {
    type ReportableInformation,
    reportableInformationSchema,
} from '../behaviors/utils.js';
import { simulationEventSchema } from './simulation-event.js';

export const startCollectingInformationSchema = z.strictObject({
    ...simulationEventSchema.shape,
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
