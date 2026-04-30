import type { Immutable, WritableDraft } from 'immer';
import type { ExerciseState } from '../../state.js';
import type { TemplateType } from '../template.js';
import type { ChangeApply } from '../../marketplace/exercise-collection-upgrade/exercise-collection-change-apply.js';
import type { ChangedElementDto } from '../../marketplace/conflict-detection.js';
import type { ChangeImpact } from '../../marketplace/exercise-collection-upgrade/exercise-collection-change-impact.js';

interface MarketplaceRegistryEntry {
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

    changeImpact: (
        state: ExerciseState,
        changedElements: ChangedElementDto
    ) => ChangeImpact[];
}

const marketplaceRegistry: {
    [K in TemplateType]?: MarketplaceRegistryEntry;
} = {};

export function registerMarketplaceElement<T extends TemplateType>(
    templateType: T,
    entry: MarketplaceRegistryEntry
): void {
    marketplaceRegistry[templateType] = entry;
}

export function getMarketplaceRegistryEntry<T extends TemplateType>(
    templateType: T
): MarketplaceRegistryEntry | undefined {
    return marketplaceRegistry[templateType];
}

export function getAllMarketplaceRegistryEntries(): {
    [K in TemplateType]?: MarketplaceRegistryEntry;
} {
    return marketplaceRegistry as {
        [K in TemplateType]?: MarketplaceRegistryEntry;
    };
}
