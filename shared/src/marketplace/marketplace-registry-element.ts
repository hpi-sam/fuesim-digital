import type { Immutable, WritableDraft } from 'immer';
import type { z } from 'zod';
import type { ExerciseState } from '../state.js';
import type { ChangeApply } from './exercise-collection-upgrade/exercise-collection-change-apply.js';
import type { ChangeImpact } from './exercise-collection-upgrade/exercise-collection-change-impact.js';

export function defineMarketplaceElement<
    T extends z.ZodObject<
        z.ZodRawShape & { type: z.ZodType<string>; id: z.ZodType }
    >,
>(entry: MarketplaceRegistryEntry<T>): MarketplaceRegistryEntry<T> {
    return entry;
}

export interface MarketplaceRegistryEntry<
    T extends z.ZodObject<
        z.ZodRawShape & { type: z.ZodType<string>; id: z.ZodType }
    >,
    TChangedTemplateVersion = unknown,
> {
    naming: {
        singular: string;
        plural: string;
    };
    templateSchema: T;
    types: string[];

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
        changedElements: TChangedTemplateVersion
    ) => { impact: ChangeImpact[]; apply: ChangeApply[] };
}
