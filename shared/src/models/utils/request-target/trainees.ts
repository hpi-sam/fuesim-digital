import type { WritableDraft } from 'immer';
import { IsValue } from '../../../utils/validators/is-value.js';
import { cloneDeepMutable } from '../../../utils/clone-deep.js';
import { getCreate } from '../../../models/utils/get-create.js';
import { RadiogramUnpublishedStatus } from '../../../models/radiogram/status/radiogram-unpublished-status.js';
import { publishRadiogram } from '../../../models/radiogram/radiogram-helpers-mutable.js';
import { nextUUID } from '../../../simulation/utils/randomness.js';
import { ResourceRequestRadiogram } from '../../radiogram/resource-request-radiogram.js';
import { isDone, isUnread } from '../../radiogram/radiogram-helpers.js';
import { StrictObject } from '../../../utils/strict-object.js';
import { isEmptyResource } from '../rescue-resource.js';
import type {
    RequestTarget,
    RequestTargetConfiguration,
} from './request-target.js';

export class TraineesRequestTargetConfiguration
    implements RequestTargetConfiguration
{
    @IsValue('traineesRequestTarget')
    public readonly type = 'traineesRequestTarget';

    static readonly create = getCreate(this);
}

export const traineesRequestTarget: RequestTarget<TraineesRequestTargetConfiguration> =
    {
        configuration: TraineesRequestTargetConfiguration,
        createRequest: (
            draftState,
            requestingSimulatedRegionId,
            _configuration,
            requestedResource,
            key
        ) => {
            const unreadRadiogram = StrictObject.values(
                draftState.radiograms
            ).find(
                (radiogram) =>
                    radiogram.type === 'resourceRequestRadiogram' &&
                    isUnread(radiogram) &&
                    radiogram.resourceRequestKey === key
            ) as WritableDraft<ResourceRequestRadiogram> | undefined;
            if (unreadRadiogram) {
                if (isEmptyResource(requestedResource)) {
                    delete draftState.radiograms[unreadRadiogram.id];
                } else {
                    unreadRadiogram.requiredResource = requestedResource;
                }
                return;
            }

            if (
                StrictObject.values(draftState.radiograms)
                    .filter(
                        (radiogram) =>
                            radiogram.type === 'resourceRequestRadiogram' &&
                            radiogram.resourceRequestKey === key
                    )
                    .every(isDone) &&
                !isEmptyResource(requestedResource)
            ) {
                const radiogram = cloneDeepMutable(
                    ResourceRequestRadiogram.create(
                        nextUUID(draftState),
                        requestingSimulatedRegionId,
                        null,
                        RadiogramUnpublishedStatus.create()
                    )
                );
                radiogram.requiredResource = requestedResource;
                radiogram.resourceRequestKey = key;
                radiogram.informationAvailable = true;
                publishRadiogram(draftState, radiogram);
                // eslint-disable-next-line no-useless-return
                return;
            }

            /**
             * There is a radiogram that is currently accepted,
             * we therefore wait for an answer and don't send another request
             */
        },
    };
