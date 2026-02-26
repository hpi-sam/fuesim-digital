import type { WritableDraft } from 'immer';
import type { VehicleResource } from '../../../models/index.js';
import type { ExerciseState } from '../../../state.js';
import type { Constructor, UUID } from '../../../utils/index.js';

export class RequestTargetConfiguration {
    public readonly type!: `${string}RequestTarget`;
}

export interface RequestTarget<T extends RequestTargetConfiguration> {
    readonly configuration: Constructor<T>;
    readonly createRequest: (
        draftState: WritableDraft<ExerciseState>,
        requestingSimulatedRegionId: UUID,
        configuration: WritableDraft<T>,
        requestedResource: WritableDraft<VehicleResource>,
        key: string
    ) => void;
}
