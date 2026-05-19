import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

interface WithScoutableId {
    scoutableId: null;
}

export const addScoutables50: Migration = {
    action: (intermediateState, action) => {
        const typedAction = action as { type: string };
        switch (typedAction.type) {
            case '[Patient] Add patient': {
                const typedPatientAction = action as {
                    patient: WithScoutableId;
                };
                typedPatientAction.patient.scoutableId = null;
                break;
            }
            case '[MapImage] Add MapImage': {
                const typedMapImageAction = action as {
                    mapImage: WithScoutableId;
                };
                typedMapImageAction.mapImage.scoutableId = null;
                break;
            }
            default:
                break;
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            scoutables: { [key in UUID]: any } | undefined;

            patients: { [key in UUID]: { scoutableId: null | undefined } };
            mapImages: { [key in UUID]: { scoutableId: null | undefined } };
        };

        typedState.scoutables = {};
        Object.values(typedState.patients).forEach((patient) => {
            patient.scoutableId = null;
        });
        Object.values(typedState.mapImages).forEach((mapImages) => {
            mapImages.scoutableId = null;
        });
    },
};
