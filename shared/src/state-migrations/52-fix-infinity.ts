import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const fixInfinity52: Migration = {
    action: (_, action) => {
        const typedAction = action as { type: string };
        switch (typedAction.type) {
            case '[AutomaticDistributionBehavior] Change Limit': {
                const typedBehaviorAction = action as {
                    newLimit: number;
                };
                if (typedBehaviorAction.newLimit >= Number.MAX_SAFE_INTEGER) {
                    typedBehaviorAction.newLimit = Number.MAX_SAFE_INTEGER;
                }
                break;
            }
            default:
                break;
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            simulatedRegions: {
                [Key in UUID]: {
                    behaviors: (
                        | {
                              type: 'automaticallyDistributeVehiclesBehavior';
                              distributionLimits: { [Key2 in string]: number };
                          }
                        | { type: 'otherBehavior' }
                    )[];
                };
            };
        };

        for (const simulatedRegion of Object.values(
            typedState.simulatedRegions
        )) {
            for (const behavior of simulatedRegion.behaviors) {
                if (behavior.type !== 'automaticallyDistributeVehiclesBehavior')
                    continue;
                for (const [key, value] of Object.entries(
                    behavior.distributionLimits
                )) {
                    if (value >= Number.MAX_SAFE_INTEGER) {
                        behavior.distributionLimits[key] =
                            Number.MAX_SAFE_INTEGER;
                    }
                }
            }
        }
    },
};
