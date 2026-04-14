import type { WritableDraft } from 'immer';
import { z } from 'zod';
import { cloneDeepMutable } from '../../../utils/clone-deep.js';
import { newRadiogramUnpublishedStatus } from '../../radiogram/status/radiogram-unpublished-status.js';
import { publishRadiogram } from '../../radiogram/radiogram-helpers-mutable.js';
import { nextUUID } from '../../../simulation/utils/randomness.js';
import type { ResourceRequestRadiogram } from '../../radiogram/resource-request-radiogram.js';
import { newResourceRequestRadiogram } from '../../radiogram/resource-request-radiogram.js';
import { isDone, isUnread } from '../../radiogram/radiogram-helpers.js';
import { StrictObject } from '../../../utils/strict-object.js';
import { isEmptyResource } from '../rescue-resource.js';
import type { RequestTarget } from './request-target.js';
import { requestTargetConfigurationSchema } from './request-target.js';

export const traineesRequestTargetConfigurationSchema = z.strictObject({
    ...requestTargetConfigurationSchema.shape,
    type: z.literal('traineesRequestTarget'),
});
export type TraineesRequestTargetConfiguration = z.infer<
    typeof traineesRequestTargetConfigurationSchema
>;

export function newTraineesRequestTargetConfiguration(): TraineesRequestTargetConfiguration {
    return { type: 'traineesRequestTarget' };
}

export const traineesRequestTarget: RequestTarget<TraineesRequestTargetConfiguration> =
    {
        configurationSchema: traineesRequestTargetConfigurationSchema,
        type: 'traineesRequestTarget',
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
                    newResourceRequestRadiogram(
                        nextUUID(draftState),
                        requestingSimulatedRegionId,
                        null,
                        newRadiogramUnpublishedStatus()
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
