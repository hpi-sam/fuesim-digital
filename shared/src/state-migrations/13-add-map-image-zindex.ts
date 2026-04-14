import type { Action } from '../store/action-reducer.js';
import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const addMapImageZIndex13: Migration = {
    action: (_intermediaryState, action) => {
        if ((action as Action).type === '[MapImage] Add MapImage') {
            (action as { mapImage: { zIndex: number } }).mapImage.zIndex = 0;
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            mapImages: { [key: UUID]: { zIndex: number } };
        };
        Object.values(typedState.mapImages).forEach((mapImage) => {
            mapImage.zIndex = 0;
        });
    },
};
