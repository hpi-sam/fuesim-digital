import type { WritableDraft } from 'immer';
import type { ZodType } from 'zod';
import { z } from 'zod';
import type { ExerciseState } from '../../../state.js';
import type { UUID } from '../../../utils/uuid.js';
import type { VehicleResource } from '../rescue-resource.js';

export const requestTargetConfigurationSchema = z.strictObject({
    type: z.string('requestTarget'),
});
export type RequestTargetConfiguration = z.infer<
    typeof requestTargetConfigurationSchema
>;

export interface RequestTarget<T extends RequestTargetConfiguration> {
    readonly configurationSchema: ZodType<T>;
    readonly type: T['type'];
    readonly createRequest: (
        draftState: WritableDraft<ExerciseState>,
        requestingSimulatedRegionId: UUID,
        configuration: WritableDraft<T>,
        requestedResource: WritableDraft<VehicleResource>,
        key: string
    ) => void;
}
