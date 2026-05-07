import type { WritableDraft, Immutable } from 'immer';
import { z } from 'zod';
import type { ExerciseState } from '../../state.js';
import type { ChangedElementDto } from '../conflict-detection.js';
import type { ChangeApply } from '../exercise-collection-upgrade/exercise-collection-change-apply.js';
import type { ChangeImpact } from '../exercise-collection-upgrade/exercise-collection-change-impact.js';
import { alarmGroupSchema } from '../../models/alarm-group.js';
import { vehicleTemplateSchema } from '../../models/vehicle-template.js';
import type { ImmutableInfer } from '../../utils/infer.js';
import type {
    VersionedElementModel} from '../models/versioned-element-model.js';
import {
    versionedElementModelSchema,
} from '../models/versioned-element-model.js';
import { marketplaceAlarmGroup } from './alarm-group.marketplace.js';
import { marketplaceVehicleTemplate } from './vehicle-template.marketplace.js';

export const marketplaceElementContentSchema = z.discriminatedUnion('type', [
    alarmGroupSchema,
    vehicleTemplateSchema,
]);

export type MarketplaceElementContent = ImmutableInfer<
    typeof marketplaceElementContentSchema
>;

export const marketplaceElementsDefinitions: {
    [key in MarketplaceElementContent['type']]: MarketplaceRegistryEntry;
} = {
    alarmGroup: marketplaceAlarmGroup,
    vehicleTemplate: marketplaceVehicleTemplate,
};

export function isMarketplaceElementContent(
    content: any
): content is WritableDraft<MarketplaceElementContent> {
    return marketplaceElementContentSchema.safeParse(content).success;
}

export const versionedMarketplaceElementContentSchema = z.union(
    // We want to enforce "entity" (from versionedElementModelSchema)
    // to be present in every option of versionedElementContentSchema
    marketplaceElementContentSchema.options.map((option) =>
        z.object({
            ...option.shape,
            ...versionedElementModelSchema.shape,
        })
    )
);

export type VersionedMarketplaceElementContent = Immutable<
    z.infer<typeof versionedMarketplaceElementContentSchema>
>;

export function hasEntityProperties(
    element: object
): element is { entity: VersionedElementModel['entity'] } {
    if (!('entity' in element)) return false;
    return versionedElementModelSchema.shape.entity.safeParse(element.entity)
        .success;
}

export interface MarketplaceRegistryEntry {
    naming: {
        singular: string;
        plural: string;
    };
    /**
     * Defines how to handle a ChangeApply (how to handle edited/removed
     * marketplace elements in the state) specified by the user when
     * upgrading a collection inside an exercise to the newest version.
     *
     * WARNING: It is crucial that this function is deterministic as
     * it is used in a reducer to apply to user-defined changes to the state
     */
    changeApply: (
        state: WritableDraft<ExerciseState>,
        changeApplies: Immutable<ChangeApply>
    ) => void;

    /**
     * Defines how and where to search for changes
     * in the state based on the changed marketplace element.
     *
     * Returns a ChangeImpact that defines the impact
     * that a change to this marketplace element has on the state.
     *
     * This ChangeImpact can then later be presented to the user for
     * conflict resolution.
     *
     */
    changeImpact: (
        state: ExerciseState,
        changedElements: ChangedElementDto
    ) => ChangeImpact[];
}
